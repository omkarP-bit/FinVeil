import { ethers } from "ethers";

let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Wallet | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(
      process.env.FHENIX_RPC_URL || "https://api.helium.fhenix.zone"
    );
  }
  return provider;
}

function getSigner(): ethers.Wallet {
  if (!signer) {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) throw new Error("PRIVATE_KEY not configured");
    signer = new ethers.Wallet(pk, getProvider());
  }
  return signer;
}

const MODEL_CONSTANTS = {
  SCALE: 1000,
  FEATURE_SCALE: 100,
  OFFSET: 100000,
  POLY_SCALE: 1000000,
  WEIGHTS: [99968, 99479, 100414, 101346, 100388, 101010],
  BIAS: 176938,
  POLY_COEFFS: [622897, 300176, 83038],
};

function getContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) return null;
  const abi = [
    "function updateProfile((bytes32,bytes32) calldata duration, (bytes32,bytes32) calldata checkNeg, (bytes32,bytes32) calldata checkNone, (bytes32,bytes32) calldata checkHigh, (bytes32,bytes32) calldata creditPaid, (bytes32,bytes32) calldata creditNone) external",
    "function grantOneTimePermit(address requester, bytes32 lensId, uint256 expiresAt) external",
    "function requestScore(address user, bytes32 lensId) external returns (bytes32)",
    "function getScore(address user, bytes32 lensId) external view returns (bytes32)",
    "function submitKYC((bytes32,bytes32) calldata nameHash, (bytes32,bytes32) calldata dobEncoded, (bytes32,bytes32) calldata idHash, (bytes32,bytes32) calldata addressHash) external",
    "function requestVerification(address user, uint8 checkId, address requester, uint256 dobCutoff) external returns (bytes32, bytes32)",
    "function lensThresholds(bytes32) external view returns (uint8,uint8,uint8,bool)",
  ];
  return new ethers.Contract(address, abi, getSigner());
}

// ── Local ML scoring (used when contract is unavailable) ──

export function computeMLScore(features: number[]): { probability: number; decisionLabel: string } {
  const { WEIGHTS, BIAS, OFFSET, SCALE, FEATURE_SCALE, POLY_COEFFS, POLY_SCALE } = MODEL_CONSTANTS;
  const S = SCALE * FEATURE_SCALE;

  // Compute z exactly as the on-chain contract does (unsigned quantized)
  let zUnsigned = BIAS;
  for (let i = 0; i < 6; i++) {
    zUnsigned += WEIGHTS[i] * features[i] * FEATURE_SCALE;
  }

  // Remove the OFFSET baked into every weight and the bias
  let offsetRemoval = OFFSET;
  for (let i = 0; i < 6; i++) {
    offsetRemoval += OFFSET * features[i] * FEATURE_SCALE;
  }

  const zFloat = (zUnsigned - offsetRemoval) / S;

  // Polynomial activation (sigmoid approximation)
  const c0 = (POLY_COEFFS[0] - OFFSET) / POLY_SCALE;
  const c1 = (POLY_COEFFS[1] - OFFSET) / POLY_SCALE;
  const c2 = (POLY_COEFFS[2] - OFFSET) / POLY_SCALE;

  const prob = Math.max(0, Math.min(1, c0 + c1 * zFloat + c2 * zFloat ** 2));

  let decisionLabel: string;
  if (prob >= 0.8) decisionLabel = "Tier A — Approved";
  else if (prob >= 0.6) decisionLabel = "Tier B — Approved";
  else if (prob >= 0.4) decisionLabel = "Tier C — Conditional";
  else decisionLabel = "Declined";

  return { probability: prob, decisionLabel };
}

// ── On-chain wrappers (CONTRACT_ADDRESS must be set) ──

export async function submitProfile(encryptedFields: Record<string, string>): Promise<string> {
  const contract = getContract();
  if (!contract) throw new Error("CONTRACT_ADDRESS not configured — cannot submit to chain");

  const tx = await contract.updateProfile(
    encryptedFields.duration,
    encryptedFields.checkNeg,
    encryptedFields.checkNone,
    encryptedFields.checkHigh,
    encryptedFields.creditPaid,
    encryptedFields.creditNone
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function grantPermit(
  userAddress: string,
  requester: string,
  lensId: string,
  expiresAt: number
): Promise<string> {
  const contract = getContract();
  if (!contract) throw new Error("CONTRACT_ADDRESS not configured — cannot grant on-chain permit");

  const tx = await contract.grantOneTimePermit(requester, lensId, expiresAt);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function requestScore(
  userAddress: string,
  lensId: string
): Promise<{ decisionLabel: string; scoreHandle: string; txHash: string }> {
  const contract = getContract();
  if (!contract) throw new Error("CONTRACT_ADDRESS not configured — cannot request score on-chain");

  const tx = await contract.requestScore(userAddress, lensId);
  const receipt = await tx.wait();

  const signedVal = BigInt(tx.toString());
  const offsetRemoval = BigInt(MODEL_CONSTANTS.OFFSET) * 7n + BigInt(MODEL_CONSTANTS.OFFSET);
  const zScaled = signedVal - offsetRemoval;
  const z = Number(zScaled) / (MODEL_CONSTANTS.SCALE * MODEL_CONSTANTS.FEATURE_SCALE);

  const c0 = (MODEL_CONSTANTS.POLY_COEFFS[0] - MODEL_CONSTANTS.OFFSET) / MODEL_CONSTANTS.POLY_SCALE;
  const c1 = (MODEL_CONSTANTS.POLY_COEFFS[1] - MODEL_CONSTANTS.OFFSET) / MODEL_CONSTANTS.POLY_SCALE;
  const c2 = (MODEL_CONSTANTS.POLY_COEFFS[2] - MODEL_CONSTANTS.OFFSET) / MODEL_CONSTANTS.POLY_SCALE;
  const prob = Math.max(0, Math.min(1, c0 + c1 * z + c2 * z ** 2));

  let decisionLabel: string;
  if (prob >= 0.8) decisionLabel = "Tier A — Approved";
  else if (prob >= 0.6) decisionLabel = "Tier B — Approved";
  else if (prob >= 0.4) decisionLabel = "Tier C — Conditional";
  else decisionLabel = "Declined";

  return { decisionLabel, scoreHandle: tx.toString(), txHash: receipt.hash };
}

export async function getLensThresholds(lensId: string) {
  const contract = getContract();
  if (!contract) return null;

  const t = await contract.lensThresholds(lensId);
  return { exists: t.exists, thresholdA: t.thresholdA, thresholdB: t.thresholdB, thresholdC: t.thresholdC };
}

export async function submitKYC(encryptedFields: Record<string, string>): Promise<string> {
  const contract = getContract();
  if (!contract) throw new Error("CONTRACT_ADDRESS not configured — cannot submit KYC to chain");

  const tx = await contract.submitKYC(
    encryptedFields.nameHash, encryptedFields.dobEncoded,
    encryptedFields.idHash, encryptedFields.addressHash
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function requestVerification(
  userAddress: string, checkId: number, requester: string, dobCutoff: number
): Promise<{ sessionId: string; resultHandle: string }> {
  const contract = getContract();
  if (!contract) throw new Error("CONTRACT_ADDRESS not configured — cannot verify on-chain");

  const result = await contract.requestVerification(userAddress, checkId, requester, dobCutoff);
  return { sessionId: result[0], resultHandle: result[1] };
}
