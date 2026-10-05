import { Pool, type PoolClient, type QueryResultRow } from "pg";

// ── Type parsing ────────────────────────────────────────────────────
// node-postgres returns NUMERIC/INT8 as strings to avoid precision loss.
// For this schema every numeric value is a small score or count, so parse eagerly.
import pgTypes from "pg";

pgTypes.types.setTypeParser(1700, (v: string) => Number.parseFloat(v)); // NUMERIC
pgTypes.types.setTypeParser(20, (v: string) => Number.parseInt(v, 10)); // INT8

export type EncryptedField = { data: string; securityZone: number };
export type FeatureValue = number | EncryptedField;
export type FeatureMap = Record<string, FeatureValue>;

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured");
    }
    pool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
    pool.on("error", (err) => {
      console.error("[db] idle client error:", err.message);
    });
  }
  return pool;
}

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(text, params as never[]);
  return result.rows;
}

async function queryOne<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── Row shapes ──────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string | null;
  name: string;
  wallet_address: string | null;
  oauth_provider: string | null;
  oauth_sub: string | null;
  is_seeded: boolean;
  created_at: Date;
}

export interface ProfileRecord {
  user_id: string;
  is_encrypted: boolean;
  features: FeatureMap;
  last_updated_at: Date;
}

export interface KYCRecord {
  user_id: string;
  is_encrypted: boolean;
  fields: Record<string, string | EncryptedField>;
  last_updated_at: Date;
}

export interface PermitRecord {
  id: string;
  user_id: string;
  lens_id: string;
  requester_app_id: string;
  granted_at: Date;
  expires_at: Date;
  used: boolean;
  used_at: Date | null;
}

export interface DecisionRecord {
  id: string;
  user_id: string;
  lens_id: string;
  decision_label: string;
  probability: number;
  decided_at: Date;
}

export interface VerificationTokenRecord {
  id: string;
  user_id: string;
  requester_app_id: string;
  check_id: number;
  result: string;
  session_id: string;
  issued_at: Date;
  expires_at: Date;
  used: boolean;
}

export interface LensRecord {
  lensId: string;
  name: string;
  description: string;
}

export interface AppRecord {
  id: string;
  name: string;
  category: string;
}

// ── Users ───────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (!isValidUuid(id)) return null;
  return queryOne<UserRecord>("SELECT * FROM users WHERE id = $1", [id]);
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  return queryOne<UserRecord>("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
}

export async function createLocalUser(
  email: string,
  passwordHash: string | null,
  name: string,
  walletAddress: string | null,
  isSeeded = false
): Promise<UserRecord> {
  return queryOne<UserRecord>(
    `INSERT INTO users (email, password_hash, name, wallet_address, is_seeded)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email.toLowerCase(), passwordHash, name, walletAddress, isSeeded]
  ).then(assertRow);
}

export async function upsertOAuthUser(
  provider: string,
  sub: string,
  email: string,
  name: string,
  walletAddress: string
): Promise<UserRecord> {
  const row = await queryOne<UserRecord>(
    `INSERT INTO users (email, name, wallet_address, oauth_provider, oauth_sub)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (oauth_provider, oauth_sub) WHERE oauth_provider IS NOT NULL AND oauth_sub IS NOT NULL
     DO UPDATE SET name = EXCLUDED.name, wallet_address = EXCLUDED.wallet_address
     RETURNING *`,
    [email.toLowerCase(), name, walletAddress, provider, sub]
  );
  return assertRow(row);
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function assertRow<T>(row: T | null): T {
  if (!row) throw new Error("Database write returned no rows");
  return row;
}

// ── Lenses & apps ───────────────────────────────────────────────────

export async function getLenses(): Promise<LensRecord[]> {
  const rows = await query<{ lens_id: string; name: string; description: string | null }>(
    "SELECT lens_id, name, description FROM lens_registry ORDER BY lens_id"
  );
  return rows.map((r) => ({ lensId: r.lens_id, name: r.name, description: r.description ?? "" }));
}

export async function getLensById(lensId: string): Promise<LensRecord | null> {
  const row = await queryOne<{ lens_id: string; name: string; description: string | null }>(
    "SELECT lens_id, name, description FROM lens_registry WHERE lens_id = $1",
    [lensId]
  );
  return row ? { lensId: row.lens_id, name: row.name, description: row.description ?? "" } : null;
}

export async function getApps(): Promise<AppRecord[]> {
  return query<{ id: string; name: string; category: string | null }>(
    "SELECT id, name, category FROM apps ORDER BY id"
  ).then((rows) => rows.map((r) => ({ id: r.id, name: r.name, category: r.category ?? "" })));
}

export async function appExists(appId: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>("SELECT true AS exists FROM apps WHERE id = $1", [appId]);
  return !!row;
}

// ── Profile ─────────────────────────────────────────────────────────

export async function saveProfile(userId: string, features: FeatureMap): Promise<ProfileRecord> {
  const isEncrypted = hasEncryptedValue(features);
  const row = await queryOne<ProfileRecord>(
    `INSERT INTO profiles_meta (user_id, is_encrypted, features, last_updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (user_id) DO UPDATE
       SET features = EXCLUDED.features,
           is_encrypted = EXCLUDED.is_encrypted,
           last_updated_at = now()
     RETURNING user_id, is_encrypted, features, last_updated_at`,
    [userId, isEncrypted, JSON.stringify(features)]
  );
  return assertRow(row);
}

export async function getProfile(userId: string): Promise<ProfileRecord | null> {
  if (!isValidUuid(userId)) return null;
  return queryOne<ProfileRecord>(
    "SELECT user_id, is_encrypted, features, last_updated_at FROM profiles_meta WHERE user_id = $1",
    [userId]
  );
}

// ── Permits ─────────────────────────────────────────────────────────

export async function addPermit(
  userId: string,
  lensId: string,
  requesterAppId: string,
  expiresAt: string
): Promise<PermitRecord> {
  const row = await queryOne<PermitRecord>(
    `INSERT INTO permits_log (user_id, lens_id, requester_app_id, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, lensId, requesterAppId, expiresAt]
  );
  return assertRow(row);
}

export async function getPermits(userId: string): Promise<PermitRecord[]> {
  if (!isValidUuid(userId)) return [];
  return query<PermitRecord>(
    "SELECT * FROM permits_log WHERE user_id = $1 ORDER BY granted_at ASC",
    [userId]
  );
}

// ── Decisions ───────────────────────────────────────────────────────

export async function addDecision(
  userId: string,
  lensId: string,
  decisionLabel: string,
  probability: number
): Promise<DecisionRecord> {
  const row = await queryOne<DecisionRecord>(
    `INSERT INTO decisions (user_id, lens_id, decision_label, probability)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, lensId, decisionLabel, probability]
  );
  return assertRow(row);
}

export async function getDecisions(userId: string): Promise<DecisionRecord[]> {
  if (!isValidUuid(userId)) return [];
  return query<DecisionRecord>(
    "SELECT * FROM decisions WHERE user_id = $1 ORDER BY decided_at ASC",
    [userId]
  );
}

// ── KYC ─────────────────────────────────────────────────────────────

export async function saveKYC(
  userId: string,
  fields: Record<string, string | EncryptedField>
): Promise<KYCRecord> {
  const isEncrypted = Object.values(fields).some(isEncryptedField);
  const row = await queryOne<KYCRecord>(
    `INSERT INTO kyc_meta (user_id, is_encrypted, fields, last_updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (user_id) DO UPDATE
       SET fields = EXCLUDED.fields,
           is_encrypted = EXCLUDED.is_encrypted,
           last_updated_at = now()
     RETURNING user_id, is_encrypted, fields, last_updated_at`,
    [userId, isEncrypted, JSON.stringify(fields)]
  );
  return assertRow(row);
}

export async function getKYC(userId: string): Promise<KYCRecord | null> {
  if (!isValidUuid(userId)) return null;
  return queryOne<KYCRecord>(
    "SELECT user_id, is_encrypted, fields, last_updated_at FROM kyc_meta WHERE user_id = $1",
    [userId]
  );
}

// ── Verification tokens ─────────────────────────────────────────────

export async function addVerificationToken(
  userId: string,
  requesterAppId: string,
  checkId: number,
  result: boolean,
  sessionId: string,
  expiresAt: string
): Promise<VerificationTokenRecord> {
  const row = await queryOne<VerificationTokenRecord>(
    `INSERT INTO verification_tokens (user_id, requester_app_id, check_id, result, session_id, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, requesterAppId, checkId, String(result), sessionId, expiresAt]
  );
  return assertRow(row);
}

export async function getVerificationTokens(userId: string): Promise<VerificationTokenRecord[]> {
  if (!isValidUuid(userId)) return [];
  return query<VerificationTokenRecord>(
    "SELECT * FROM verification_tokens WHERE user_id = $1 ORDER BY issued_at ASC",
    [userId]
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

export function isEncryptedField(value: unknown): value is EncryptedField {
  return typeof value === "object" && value !== null && "data" in (value as object) && "securityZone" in (value as object);
}

function hasEncryptedValue(map: FeatureMap): boolean {
  return Object.values(map).some(isEncryptedField);
}

export async function pingDatabase(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
