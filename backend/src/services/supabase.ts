import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    client = createClient(url, key);
  }

  return client;
}

export interface UserRecord {
  id: string;
  oauth_provider: string;
  oauth_sub: string;
  wallet_address: string | null;
  email: string;
  name: string;
}

export async function upsertUser(
  provider: string,
  sub: string,
  wallet: string,
  email = "",
  name = ""
): Promise<UserRecord> {
  const sb = getSupabase();
  if (!sb) {
    return {
      id: `${provider}_${sub}`,
      oauth_provider: provider,
      oauth_sub: sub,
      wallet_address: wallet,
      email,
      name,
    };
  }

  const q = sb.from("users") as never;
  const { data, error } = await (q as any)
    .upsert(
      { oauth_provider: provider, oauth_sub: sub, wallet_address: wallet, email, name },
      { onConflict: "oauth_provider,oauth_sub" }
    )
    .select()
    .single() as { data: UserRecord | null; error: any };

  if (error) throw error;
  if (!data) throw new Error("User upsert returned no data");
  return data;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const q = sb.from("users") as never;
  const { data } = await (q as any).select("*").eq("id", id).single() as { data: UserRecord | null; error: any };
  return data;
}

// ── Logging helpers (graceful — silently skip if DB/table unreachable) ──

function fromTable(name: string) {
  const sb = getSupabase();
  return sb ? sb.from(name as never) : null;
}

async function silentInsert(table: string, row: Record<string, unknown>): Promise<void> {
  const q = fromTable(table);
  if (!q) return;
  try {
    await q.insert(row as never);
  } catch {
    // logging is best-effort
  }
}

export async function logPermitGrant(
  userId: string,
  lensId: string,
  requesterAppId: string,
  expiresAt: string
): Promise<void> {
  await silentInsert("permits_log", {
    user_id: userId,
    lens_id: lensId,
    requester_app_id: requesterAppId,
    granted_at: new Date().toISOString(),
    expires_at: expiresAt,
    used: false,
  });
}

export async function logDecision(
  userId: string,
  lensId: string,
  decisionLabel: string
): Promise<void> {
  await silentInsert("decisions", {
    user_id: userId,
    lens_id: lensId,
    decision_label: decisionLabel,
    decided_at: new Date().toISOString(),
  });
}

export async function logVerificationToken(
  userId: string,
  requesterAppId: string,
  checkId: number,
  result: string,
  sessionId: string,
  expiresAt: string
): Promise<void> {
  await silentInsert("verification_tokens", {
    user_id: userId,
    requester_app_id: requesterAppId,
    check_id: checkId,
    result,
    issued_at: new Date().toISOString(),
    expires_at: expiresAt,
    session_id: sessionId,
    used: false,
  });
}
