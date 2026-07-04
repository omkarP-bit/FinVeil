import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Deploying FinVeilVault...");

  const [signer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${signer.address}`);

  const vault = await hre.ethers.deployContract("FinVeilVault", signer);
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log(`FinVeilVault deployed to: ${vaultAddress}`);

  // Model constants (trained on German Credit dataset, 74.5% accuracy)
  const MODEL_CONSTANTS = {
    SCALE: 1000,
    FEATURE_SCALE: 100,
    OFFSET: 100000,
    POLY_SCALE: 1000000,
    weights: [99968, 99479, 100414, 101346, 100388, 101010],
    bias: 176938,
    polyCoeffs: [622897, 300176, 83038],
  };

  console.log("\n=== ML Model Constants (embedded in contract) ===");
  console.log(`SCALE=${MODEL_CONSTANTS.SCALE}`);
  console.log(`FEATURE_SCALE=${MODEL_CONSTANTS.FEATURE_SCALE}`);
  console.log(`OFFSET=${MODEL_CONSTANTS.OFFSET}`);
  console.log(`POLY_SCALE=${MODEL_CONSTANTS.POLY_SCALE}`);
  console.log(`Weights: ${MODEL_CONSTANTS.weights.join(", ")}`);
  console.log(`Bias: ${MODEL_CONSTANTS.bias}`);
  console.log(`Poly coeffs: ${MODEL_CONSTANTS.polyCoeffs.join(", ")}`);

  // Set lens thresholds for default lenses
  const lenses = [
    {
      id: hre.ethers.encodeBytes32String("rental-readiness"),
      name: "Rental-Readiness",
      thresholds: { a: 80, b: 60, c: 40 },
    },
    {
      id: hre.ethers.encodeBytes32String("bnpl-affordability"),
      name: "BNPL Affordability",
      thresholds: { a: 75, b: 55, c: 35 },
    },
    {
      id: hre.ethers.encodeBytes32String("credit-tier"),
      name: "Credit Tier",
      thresholds: { a: 85, b: 65, c: 45 },
    },
    {
      id: hre.ethers.encodeBytes32String("budgeting-health"),
      name: "Budgeting Health",
      thresholds: { a: 70, b: 50, c: 30 },
    },
  ];

  for (const lens of lenses) {
    const tx = await vault.setLensThresholds(
      lens.id,
      lens.thresholds.a,
      lens.thresholds.b,
      lens.thresholds.c
    );
    await tx.wait();
    console.log(`  ✅ Lens "${lens.name}" thresholds configured`);
  }

  console.log("\n--- Deployment Summary ---");
  console.log(`Contract: ${vaultAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Lenses configured: ${lenses.length}`);
  console.log(`ML scoring model: 6 features, poly2 activation, CoFHE-quantized`);

  // Print env vars for backend
  console.log("\n--- Add to backend .env ---");
  console.log(`CONTRACT_ADDRESS=${vaultAddress}`);
  console.log(`FHENIX_RPC_URL=${process.env.FHENIX_RPC_URL || "https://api.helium.fhenix.zone"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
