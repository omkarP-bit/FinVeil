import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

type EnvMap = Record<string, string>;

const scriptPath = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(scriptPath), "..");
const envPath = path.join(backendRoot, ".env");
const examplePath = path.join(backendRoot, ".env.example");

function readFileIfExists(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

function parseEnv(content: string): EnvMap {
  const env: EnvMap = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function upsertEnvValue(content: string, key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedKey}=.*$`, "m");
  const replacement = `${key}=${value}`;

  if (pattern.test(content)) {
    return content.replace(pattern, replacement);
  }

  const prefix = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  return `${content}${prefix}${replacement}\n`;
}

function randomSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function main() {
  const exampleContent = readFileIfExists(examplePath);
  if (!fs.existsSync(envPath)) {
    if (!exampleContent) {
      throw new Error("Missing backend .env and .env.example");
    }

    fs.writeFileSync(envPath, exampleContent, "utf8");
    console.log("[bootstrap] created .env from .env.example");
  }

  let envContent = readFileIfExists(envPath);
  const env = parseEnv(envContent);
  const generated: string[] = [];
  let changed = false;

  const requiredSecrets: Array<[string, string]> = [
    ["JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET || ""],
    ["JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET || ""],
  ];

  for (const [key, currentValue] of requiredSecrets) {
    if (!currentValue) {
      const value = randomSecret();
      envContent = upsertEnvValue(envContent, key, value);
      generated.push(key);
      changed = true;
    }
  }

  if (!env.JWT_ACCESS_EXPIRY) {
    envContent = upsertEnvValue(envContent, "JWT_ACCESS_EXPIRY", "15m");
    changed = true;
  }

  if (!env.JWT_REFRESH_EXPIRY) {
    envContent = upsertEnvValue(envContent, "JWT_REFRESH_EXPIRY", "7d");
    changed = true;
  }

  if (changed || !fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent, "utf8");
  }

  if (changed) {
    console.log(`[bootstrap] updated ${path.relative(backendRoot, envPath)}`);
    if (generated.length > 0) {
      console.log(`[bootstrap] generated missing secrets: ${generated.join(", ")}`);
    }
  } else {
    console.log(`[bootstrap] ${path.relative(backendRoot, envPath)} is already up to date`);
  }

  const updatedEnv = parseEnv(envContent);
  const supabaseUrl = updatedEnv.SUPABASE_URL;
  const supabaseServiceKey = updatedEnv.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseDbPassword = updatedEnv.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log("[supabase] skipped: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for remote validation");
    console.log("[next] start the backend with: npm run dev");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    console.log(`[supabase] connection reached but schema check failed: ${error.message}`);
    if (!supabaseDbPassword) {
      console.log("[supabase] set SUPABASE_DB_PASSWORD to let the bootstrap apply backend/supabase-schema.sql automatically");
    }
  } else {
    console.log("[supabase] connection verified and users table is reachable");
  }

  if (supabaseDbPassword) {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const connectionString = `postgresql://postgres:${encodeURIComponent(supabaseDbPassword)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    const schemaPath = path.join(backendRoot, "supabase-schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    await client.connect();
    await client.query(schemaSql);
    await client.end();
    console.log("[supabase] applied backend/supabase-schema.sql to the remote database");

    const verified = await supabase.from("users").select("id").limit(1);
    if (!verified.error) {
      console.log("[supabase] users table is reachable after schema apply");
    }
  } else {
    console.log("[supabase] schema apply skipped: SUPABASE_DB_PASSWORD not set");
  }

  console.log("[next] start the backend with: npm run dev");
}

main().catch((error) => {
  console.error("[bootstrap] failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});