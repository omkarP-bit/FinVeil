import { ethers } from "ethers";

// ─────────────────────────────────────────────────────────────────
//  Contract-embedded ML model constants
//  (kept in lockstep with model/finVeil.ipynb and FinVeilVault.sol)
// ─────────────────────────────────────────────────────────────────

export const MODEL_CONSTANTS = {
  SCALE: 1000,
  FEATURE_SCALE: 100,
  OFFSET: 100000,
  POLY_SCALE: 1000000,
  WEIGHTS: [99968, 99479, 100414, 101346, 100388, 101010],
  BIAS: 176938,
  POLY_COEFFS: [622897, 300176, 83038],
} as const;

export const FEATURE_NAMES = [
  "duration",
  "checkNeg",
  "checkNone",
  "checkHigh",
  "creditPaid",
  "creditNone",
] as const;

export type Tier = "A" | "B" | "C" | "Declined";

export interface ScoreResult {
  probability: number;
  decisionLabel: string;
  tier: Tier;
}

const TIER_LABELS: Record<Tier, string> = {
  A: "Tier A — Approved",
  B: "Tier B — Approved",
  C: "Tier C — Conditional",
  Declined: "Declined",
};

export function labelForTier(tier: Tier): string {
  return TIER_LABELS[tier];
}

export function tierForProbability(probability: number): Tier {
  if (probability >= 0.8) return "A";
  if (probability >= 0.6) return "B";
  if (probability >= 0.4) return "C";
  return "Declined";
}

export function probabilityToScore(probability: number): number {
  return Math.round(Math.max(0, Math.min(1, probability)) * 1000);
}

export function scoreToTier(score: number): Tier {
  return tierForProbability(score / 1000);
}

/**
 * Signed linear pre-activation, computed exactly as FinVeilVault.requestScore
 * does on-chain (identical unsigned arithmetic), then de-offset and de-scale.
 */
export function linearScore(features: number[]): number {
  const { WEIGHTS, BIAS, OFFSET, SCALE, FEATURE_SCALE } = MODEL_CONSTANTS;

  let zUnsigned = BIAS;
  for (let i = 0; i < 6; i++) {
    zUnsigned += WEIGHTS[i] * features[i] * FEATURE_SCALE;
  }

  let offsetRemoval = OFFSET;
  for (let i = 0; i < 6; i++) {
    offsetRemoval += OFFSET * features[i] * FEATURE_SCALE;
  }

  return (zUnsigned - offsetRemoval) / (SCALE * FEATURE_SCALE);
}

/** Polynomial sigmoid approximation fitted to the true logistic function. */
export function activation(z: number): number {
  const { OFFSET, POLY_SCALE, POLY_COEFFS } = MODEL_CONSTANTS;
  const c0 = (POLY_COEFFS[0] - OFFSET) / POLY_SCALE;
  const c1 = (POLY_COEFFS[1] - OFFSET) / POLY_SCALE;
  const c2 = (POLY_COEFFS[2] - OFFSET) / POLY_SCALE;
  return Math.max(0, Math.min(1, c0 + c1 * z + c2 * z * z));
}

/**
 * Local plaintext replica of the scoring circuit. Used when the profile was
 * submitted unencrypted, and as the reference implementation the on-chain
 * path is verified against.
 */
export function computeMLScore(features: number[]): ScoreResult {
  if (features.length !== 6) {
    throw new Error(`computeMLScore expects 6 features, received ${features.length}`);
  }
  for (const [i, value] of features.entries()) {
    if (!Number.isFinite(value)) {
      throw new Error(`Feature "${FEATURE_NAMES[i]}" must be a finite number`);
    }
  }

  const probability = activation(linearScore(features));
  const tier = tierForProbability(probability);

  return { probability, tier, decisionLabel: TIER_LABELS[tier] };
}

// ── Chain access ────────────────────────────────────────────────────

let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

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
    const key = pk.startsWith("0x") ? pk : `0x${pk}`;
    signer = new ethers.Wallet(key, getProvider());
  }
  return signer;
}

const VAULT_ABI = [
  "function updateProfile((bytes,uint8) calldata duration, (bytes,uint8) calldata checkNeg, (bytes,uint8) calldata checkNone, (bytes,uint8) calldata checkHigh, (bytes,uint8) calldata creditPaid, (bytes,uint8) calldata creditNone) external",
  "function grantOneTimePermit(address requester, bytes32 lensId, uint256 expiresAt) external",
  "function requestScore(address user, bytes32 lensId) external returns (bytes32)",
  "function computeDecision(address user, bytes32 lensId) external returns (uint8, bytes32, bytes32)",
  "function getScore(address user, bytes32 lensId) external view returns (bytes32)",
  "function submitKYC((bytes,uint8) calldata nameHash, (bytes,uint8) calldata dobEncoded, (bytes,uint8) calldata idHash, (bytes,uint8) calldata addressHash) external",
  "function requestVerification(address user, uint8 checkId, address requester, uint256 dobCutoff) external returns (bytes32, bytes32)",
  "function lensThresholds(bytes32) external view returns (uint8,uint8,uint8,bool)",
];

export function isContractConfigured(): boolean {
  return !!process.env.CONTRACT_ADDRESS;
}

export function getContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) return null;
  if (!ethers.isAddress(address)) {
    throw new Error(`CONTRACT_ADDRESS is not a valid address: ${address}`);
  }
  if (!contract) {
    contract = new ethers.Contract(address, VAULT_ABI, getSigner());
  }
  return contract;
}

function toTuple(field: { data: string; securityZone: number }): [string, number] {
  return [field.data, field.securityZone];
}

// ── On-chain wrappers (CONTRACT_ADDRESS must be set) ────────────────

export async function submitProfile(
  encryptedFields: Record<string, { data: string; securityZone: number }>
): Promise<string> {
  const vault = getContract();
  if (!vault) throw new Error("CONTRACT_ADDRESS not configured — cannot submit to chain");

  const tx = await vault.updateProfile(
    toTuple(encryptedFields.duration),
    toTuple(encryptedFields.checkNeg),
    toTuple(encryptedFields.checkNone),
    toTuple(encryptedFields.checkHigh),
    toTuple(encryptedFields.creditPaid),
    toTuple(encryptedFields.creditNone)
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function grantPermit(
  requester: string,
  lensId: string,
  expiresAt: number
): Promise<string> {
  const vault = getContract();
  if (!vault) throw new Error("CONTRACT_ADDRESS not configured — cannot grant on-chain permit");

  const tx = await vault.grantOneTimePermit(requester, lensId, expiresAt);
  const receipt = await tx.wait();
  return receipt.hash;
}

export interface OnChainScore {
  txHash: string;
  scoreHandle: string;
  /** Unsigned linear pre-activation exactly as produced by requestScore. */
  zUnsigned: number;
  tier: Tier;
  decisionLabel: string;
}

/**
 * Calls requestScore and reads the returned ciphertext handle.
 *
 * The previous implementation did `BigInt(tx.toString())`, where `tx` is a
 * TransactionResponse — that yields "[object Object]" and always threw.
 * The handle is a transaction return value, so it has to be read via a static
 * call, never off the tx object.
 *
 * The handle stays encrypted. Note that the signed activation CANNOT be
 * recovered server-side: de-offsetting z requires Σ x_i, which lives inside
 * the ciphertext. That is why the tier is resolved by the contract's
 * `computeDecision` instead.
 */
export async function requestScore(userAddress: string, lensId: string): Promise<OnChainScore> {
  const vault = getContract();
  if (!vault) throw new Error("CONTRACT_ADDRESS not configured — cannot request score on-chain");

  const lensKey = ethers.encodeBytes32String(lensId);

  // Simulate first so we can read the return value instead of guessing it.
  let scoreHandle: string;
  try {
    scoreHandle = await vault.requestScore.staticCall(userAddress, lensKey);
  } catch (simErr: any) {
    throw new Error(`requestScore reverted: ${simErr?.shortMessage ?? simErr?.message ?? simErr}`);
  }

  const tx = await vault.requestScore(userAddress, lensKey);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    scoreHandle,
    zUnsigned: Number(BigInt(scoreHandle)),
    tier: "Declined",
    decisionLabel: TIER_LABELS.Declined,
  };
}

export interface OnChainDecision {
  txHash: string;
  tier: Tier;
  decisionLabel: string;
  activationHandle: string;
  scoreHandle: string;
}

/**
 * Resolves the tier on-chain. The activation polynomial and the threshold
 * comparisons run entirely on ciphertext; only the tier label is disclosed.
 */
export async function computeDecision(
  userAddress: string,
  lensId: string
): Promise<OnChainDecision> {
  const vault = getContract();
  if (!vault) throw new Error("CONTRACT_ADDRESS not configured — cannot compute decision on-chain");

  const lensKey = ethers.encodeBytes32String(lensId);

  let tierIndex: bigint;
  let activationHandle: string;
  let scoreHandle: string;
  try {
    const result = await vault.computeDecision.staticCall(userAddress, lensKey);
    tierIndex = result[0];
    activationHandle = result[1];
    scoreHandle = result[2];
  } catch (simErr: any) {
    throw new Error(
      `computeDecision reverted: ${simErr?.shortMessage ?? simErr?.message ?? simErr}`
    );
  }

  const tx = await vault.computeDecision(userAddress, lensKey);
  const receipt = await tx.wait();

  const tier = TIER_BY_INDEX[Number(tierIndex)] ?? "Declined";

  return {
    txHash: receipt.hash,
    tier,
    decisionLabel: TIER_LABELS[tier],
    activationHandle,
    scoreHandle,
  };
}

const TIER_BY_INDEX: Tier[] = ["A", "B", "C", "Declined"];


export async function getLensThresholds(lensId: string) {
  const vault = getContract();
  if (!vault) return null;

  const t = await vault.lensThresholds(ethers.encodeBytes32String(lensId));
  return { exists: t.exists, thresholdA: t.thresholdA, thresholdB: t.thresholdB, thresholdC: t.thresholdC };
}

export async function submitKYC(
  encryptedFields: Record<string, { data: string; securityZone: number }>
): Promise<string> {
  const vault = getContract();
  if (!vault) throw new Error("CONTRACT_ADDRESS not configured — cannot submit KYC to chain");

  const tx = await vault.submitKYC(
    toTuple(encryptedFields.nameHash),
    toTuple(encryptedFields.dobEncoded),
    toTuple(encryptedFields.idHash),
    toTuple(encryptedFields.addressHash)
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function requestVerification(
  userAddress: string,
  checkId: number,
  requester: string,
  dobCutoff: number
): Promise<{ sessionId: string; resultHandle: string }> {
  const vault = getContract();
  if (!vault) throw new Error("CONTRACT_ADDRESS not configured — cannot verify on-chain");

  const result = await vault.requestVerification(userAddress, checkId, requester, dobCutoff);
  return { sessionId: result[0], resultHandle: result[1] };
}
