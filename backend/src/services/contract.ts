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

function getContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) return null;
  const abi = [
    "function updateProfile((bytes32,bytes32) calldata income, (bytes32,bytes32) calldata spendVolatility, (bytes32,bytes32) calldata debtRatio, (bytes32,bytes32) calldata txnHistoryScore) external",
    "function grantOneTimePermit(address requester, bytes32 lensId, uint256 expiresAt) external",
    "function requestScore(address user, bytes32 lensId) external returns (bytes32)",
    "function getScore(address user, bytes32 lensId) external view returns (bytes32)",
    "function submitKYC((bytes32,bytes32) calldata nameHash, (bytes32,bytes32) calldata dobEncoded, (bytes32,bytes32) calldata idHash, (bytes32,bytes32) calldata addressHash) external",
    "function requestVerification(address user, uint8 checkId, address requester, uint256 dobCutoff) external returns (bytes32, bytes32)",
    "function lensWeights(bytes32) external view returns (uint8,uint8,uint8,uint8,uint8,uint8,uint8,bool)",
  ];
  return new ethers.Contract(address, abi, getSigner());
}

export async function submitProfile(encryptedFields: Record<string, string>): Promise<string> {
  const contract = getContract();
  if (!contract) return "0xmock_" + Date.now().toString(16);

  const tx = await contract.updateProfile(
    encryptedFields.income,
    encryptedFields.spendVolatility,
    encryptedFields.debtRatio,
    encryptedFields.txnHistoryScore
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
  if (!contract) return "0xmock_permit_" + Date.now().toString(16);

  const tx = await contract.grantOneTimePermit(requester, lensId, expiresAt);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function requestScore(
  userAddress: string,
  lensId: string
): Promise<{ scoreHandle: string; txHash: string }> {
  const contract = getContract();
  if (!contract) {
    const tiers = ["Tier A — Approved", "Tier B — Approved", "Tier C — Conditional", "Declined"];
    return {
      scoreHandle: "0xmock_score",
      txHash: "0xmock_" + Date.now().toString(16),
    };
  }

  const tx = await contract.requestScore(userAddress, lensId);
  const receipt = await tx.wait();
  return { scoreHandle: tx.toString(), txHash: receipt.hash };
}

export async function getLensWeights(lensId: string) {
  const contract = getContract();
  if (!contract) return null;

  const w = await contract.lensWeights(lensId);
  return {
    exists: w.exists,
    incomeWeight: w.incomeWeight,
    volatilityWeight: w.volatilityWeight,
    debtWeight: w.debtWeight,
    historyWeight: w.historyWeight,
    thresholdA: w.thresholdA,
    thresholdB: w.thresholdB,
    thresholdC: w.thresholdC,
  };
}

export async function submitKYC(encryptedFields: Record<string, string>): Promise<string> {
  const contract = getContract();
  if (!contract) return "0xmock_kyc_" + Date.now().toString(16);

  const tx = await contract.submitKYC(
    encryptedFields.nameHash,
    encryptedFields.dobEncoded,
    encryptedFields.idHash,
    encryptedFields.addressHash
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
  const contract = getContract();
  if (!contract) {
    return { sessionId: "0xmock_session", resultHandle: "0xmock_result" };
  }

  const result = await contract.requestVerification(userAddress, checkId, requester, dobCutoff);
  return { sessionId: result[0], resultHandle: result[1] };
}
