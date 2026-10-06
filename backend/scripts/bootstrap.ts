import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const scriptPath = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(scriptPath), "..");
const envPath = path.join(backendRoot, ".env");
const examplePath = path.join(backendRoot, ".env.example");

type EnvMap = Record<string, string>;

function readFileIfExists(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function parseEnv(content: string): EnvMap {
  const env: EnvMap = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    env[line.slice(0, equalsIndex).trim()] = line.slice(equalsIndex + 1).trim();
  }
  return env;
}

function upsertEnvValue(content: string, key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedKey}=.*$`, "m");
  if (pattern.test(content)) return content.replace(pattern, `${key}=${value}`);
  const prefix = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  return `${content}${prefix}${key}=${value}\n`;
}

function randomSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Ensures backend/.env exists and carries the secrets the server refuses to
 * start without. Database provisioning itself lives in scripts/db-setup.ts.
 */
async function main() {
  const exampleContent = readFileIfExists(examplePath);
  if (!fs.existsSync(envPath)) {
    if (!exampleContent) throw new Error("Missing backend .env and .env.example");
    fs.writeFileSync(envPath, exampleContent, "utf8");
    console.log("[bootstrap] created .env from .env.example");
  }

  let envContent = readFileIfExists(envPath);
  const env = parseEnv(envContent);
  const generated: string[] = [];
  let changed = false;

  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
    if (!env[key]) {
      envContent = upsertEnvValue(envContent, key, randomSecret());
      generated.push(key);
      changed = true;
    }
  }

  for (const [key, value] of [
    ["JWT_ACCESS_EXPIRY", "15m"],
    ["JWT_REFRESH_EXPIRY", "7d"],
  ] as const) {
    if (!env[key]) {
      envContent = upsertEnvValue(envContent, key, value);
      changed = true;
    }
  }

  if (!env.DATABASE_URL) {
    envContent = upsertEnvValue(envContent, "DATABASE_URL", "postgresql://finveil:finveil@127.0.0.1:5432/finveil");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log(`[bootstrap] updated .env${generated.length ? ` — generated ${generated.join(", ")}` : ""}`);
  } else {
    console.log("[bootstrap] .env is already up to date");
  }

  const { closePool, isDatabaseConfigured, pingDatabase } = await import("../src/services/db");
  if (!isDatabaseConfigured()) {
    console.log("[db] skipped: DATABASE_URL is not set");
  } else if (await pingDatabase()) {
    console.log("[db] connection verified");
  } else {
    console.log("[db] unreachable — run: npm run db:setup");
  }
  await closePool().catch(() => undefined);

  console.log("[next] provision the database with: npm run db:setup");
  console.log("[next] seed users with:            npm run db:seed");
  console.log("[next] start the backend with:      npm run dev");
}

main().catch((error) => {
  console.error("[bootstrap] failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
