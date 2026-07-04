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
}

export async function upsertUser(
  provider: string,
  sub: string,
  wallet: string
): Promise<UserRecord> {
  const sb = getSupabase();
  if (!sb) {
    return { id: `${provider}_${sub}`, oauth_provider: provider, oauth_sub: sub, wallet_address: wallet };
  }

  const { data, error } = await sb
    .from("users")
    .upsert({ oauth_provider: provider, oauth_sub: sub, wallet_address: wallet }, { onConflict: "oauth_provider,oauth_sub" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data } = await sb.from("users").select("*").eq("id", id).single();
  return data;
}
