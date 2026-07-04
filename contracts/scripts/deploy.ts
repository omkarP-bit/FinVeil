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

  // Set lens weights for default lenses
  const lenses = [
    {
      id: hre.ethers.encodeBytes32String("rental-readiness"),
      name: "Rental-Readiness",
      weights: { income: 30, volatility: 25, debt: 25, history: 20 },
      thresholds: { a: 80, b: 60, c: 40 },
    },
    {
      id: hre.ethers.encodeBytes32String("bnpl-affordability"),
      name: "BNPL Affordability",
      weights: { income: 20, volatility: 20, debt: 30, history: 30 },
      thresholds: { a: 75, b: 55, c: 35 },
    },
    {
      id: hre.ethers.encodeBytes32String("credit-tier"),
      name: "Credit Tier",
      weights: { income: 25, volatility: 30, debt: 30, history: 15 },
      thresholds: { a: 85, b: 65, c: 45 },
    },
    {
      id: hre.ethers.encodeBytes32String("budgeting-health"),
      name: "Budgeting Health",
      weights: { income: 10, volatility: 40, debt: 40, history: 10 },
      thresholds: { a: 70, b: 50, c: 30 },
    },
  ];

  for (const lens of lenses) {
    const tx = await vault.setLensWeights(
      lens.id,
      lens.weights.income,
      lens.weights.volatility,
      lens.weights.debt,
      lens.weights.history,
      lens.thresholds.a,
      lens.thresholds.b,
      lens.thresholds.c
    );
    await tx.wait();
    console.log(`  ✅ Lens "${lens.name}" configured`);
  }

  console.log("\n--- Deployment Summary ---");
  console.log(`Contract: ${vaultAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Lenses configured: ${lenses.length}`);

  // Print env vars for backend
  console.log("\n--- Add to backend .env ---");
  console.log(`CONTRACT_ADDRESS=${vaultAddress}`);
  console.log(`FHENIX_RPC_URL=${process.env.FHENIX_RPC_URL || "https://api.helium.fhenix.zone"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
