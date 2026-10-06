import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const scriptPath = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(scriptPath), "..");

/**
 * Creates the `finveil` database if it does not exist, then applies schema.sql.
 *
 * Set PGHOST/PGPORT/PGUSER/PGPASSWORD (or ADMIN_DATABASE_URL) to point at the
 * server you want to create the database on. The application itself connects
 * with DATABASE_URL from backend/.env.
 */
async function main() {
  const adminUrl = process.env.ADMIN_DATABASE_URL ?? buildAdminUrl();

  const targetDb = new URL(process.env.DATABASE_URL ?? "postgresql://finveil:finveil@127.0.0.1:5432/finveil");
  const dbName = targetDb.pathname.replace(/^\//, "");

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();

  try {
    const { rows } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (rows.length === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[db] created database "${dbName}"`);
    } else {
      console.log(`[db] database "${dbName}" already exists`);
    }
  } finally {
    await admin.end();
  }

  const schemaSql = fs.readFileSync(path.join(backendRoot, "schema.sql"), "utf8");
  const client = new Client({ connectionString: targetDb.toString() });
  await client.connect();
  try {
    await client.query(schemaSql);
    console.log("[db] applied schema.sql");

    const { rows: lensRows } = await client.query("SELECT count(*)::int AS n FROM lens_registry");
    const { rows: appRows } = await client.query("SELECT count(*)::int AS n FROM apps");
    console.log(`[db] ${lensRows[0].n} lenses and ${appRows[0].n} apps seeded`);
  } finally {
    await client.end();
  }

  console.log("[next] seed users with: npm run db:seed");
  console.log("[next] start the backend with: npm run dev");
}

function buildAdminUrl(): string {
  const host = process.env.PGHOST ?? "127.0.0.1";
  const port = process.env.PGPORT ?? "5432";
  const user = process.env.PGUSER ?? "postgres";
  const password = process.env.PGPASSWORD ?? "postgres";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
}

main().catch((error) => {
  console.error("[db] setup failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
