import dotenv from "dotenv";
import { hashPassword, generateWallet } from "../src/services/auth";
import { computeMLScore, FEATURE_NAMES } from "../src/services/contract";
import {
  closePool,
  createLocalUser,
  getUserByEmail,
  saveProfile,
  saveKYC,
  addPermit,
  addDecision,
} from "../src/services/db";

dotenv.config();

/**
 * Seeds login users into the local Postgres `finveil` database.
 *
 * By default only credentials are seeded — no financial profile, no KYC — so a
 * fresh user starts with an empty dashboard and you can drive the whole flow
 * yourself. Pass --with-data to also seed a profile, KYC record, permits and
 * decisions for each user.
 */

interface SeedUser {
  email: string;
  password: string;
  name: string;
  profile?: Record<string, number>;
  kyc?: Record<string, string>;
  permits?: Array<{ lensId: string; appId: string; expiryHours: number }>;
}

const DEFAULT_PASSWORD = "Finveil!2026";

const SEED_USERS: SeedUser[] = [
  {
    email: "alice@finveil.dev",
    password: DEFAULT_PASSWORD,
    name: "Alice Raman",
    profile: { duration: 12, checkNeg: 0, checkNone: 0, checkHigh: 1, creditPaid: 1, creditNone: 0 },
    kyc: { nameHash: "alice", dobEncoded: "19950703", idHash: "alice", addressHash: "12 Marine Drive" },
    permits: [
      { lensId: "rental-readiness", appId: "greenleaf-rentals", expiryHours: 24 },
      { lensId: "budgeting-health", appId: "finveil-dashboard", expiryHours: 12 },
    ],
  },
  {
    email: "bob@finveil.dev",
    password: DEFAULT_PASSWORD,
    name: "Bob Iyer",
    profile: { duration: 72, checkNeg: 1, checkNone: 0, checkHigh: 0, creditPaid: 0, creditNone: 0 },
    kyc: { nameHash: "bob", dobEncoded: "19850411", idHash: "bob", addressHash: "4 Residency Road" },
    permits: [{ lensId: "bnpl-affordability", appId: "paylater-co", expiryHours: 6 }],
  },
  {
    email: "carol@finveil.dev",
    password: DEFAULT_PASSWORD,
    name: "Carol Dsouza",
    profile: { duration: 36, checkNeg: 0, checkNone: 1, checkHigh: 1, creditPaid: 1, creditNone: 0 },
    permits: [{ lensId: "credit-tier", appId: "northgate-bank", expiryHours: 48 }],
  },
  { email: "demo@finveil.dev", password: DEFAULT_PASSWORD, name: "Demo User" },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[seed] DATABASE_URL is not set. Copy .env.example to .env and set it first.");
    process.exitCode = 1;
    return;
  }

  const withData = process.argv.includes("--with-data");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg?.split("=")[1];

  const users = only ? SEED_USERS.filter((u) => u.email === only) : SEED_USERS;
  if (users.length === 0) {
    console.error(`[seed] no seed user matches --only=${only}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[seed] seeding ${users.length} user(s) into ${process.env.DATABASE_URL}`);
  if (!withData) {
    console.log("[seed] credentials only — pass --with-data to also seed profile/KYC/decisions");
  }

  for (const seed of users) {
    const passwordHash = hashPassword(seed.password);
    const existing = await getUserByEmail(seed.email);

    let userId: string;
    if (existing) {
      userId = existing.id;
      console.log(`[seed] ${seed.email} already exists — reusing ${userId}`);
    } else {
      const created = await createLocalUser(seed.email, passwordHash, seed.name, generateWallet(), true);
      userId = created.id;
      console.log(`[seed] created ${seed.email} (${userId})`);
    }

    if (!withData) continue;

    if (seed.profile) {
      await saveProfile(userId, seed.profile);
      console.log(`[seed]   profile written for ${seed.email}`);
    }
    if (seed.kyc) {
      await saveKYC(userId, seed.kyc);
      console.log(`[seed]   KYC written for ${seed.email}`);
    }
    for (const permit of seed.permits ?? []) {
      await addPermit(
        userId,
        permit.lensId,
        permit.appId,
        new Date(Date.now() + permit.expiryHours * 3600_000).toISOString()
      );
      if (seed.profile) {
        const { probability, decisionLabel } = computeMLScore(
          FEATURE_NAMES.map((n) => seed.profile![n])
        );
        await addDecision(userId, permit.lensId, decisionLabel, probability);
      }
      console.log(`[seed]   permit + decision for ${seed.email} → ${permit.lensId}`);
    }
  }

  console.log("\n=== Seeded credentials ===");
  for (const u of users) {
    console.log(`  ${u.email.padEnd(24)} ${u.password}`);
  }
  console.log("\n[next] start the backend with: npm run dev");
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => undefined);
  });
