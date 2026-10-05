import { createClient } from "@supabase/supabase-js";

// Minimal Supabase Auth client, used ONLY to verify OAuth access tokens when
// Supabase sign-in is enabled. All application data lives in local Postgres.

let client: ReturnType<typeof createClient> | null = null;

export function isSupabaseAuthConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAuthClient() {
  if (!isSupabaseAuthConfigured()) return null;
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export interface SupabaseUser {
  id: string;
  email: string | null;
  fullName: string;
}

export async function verifySupabaseAccessToken(
  accessToken: string
): Promise<{ user: SupabaseUser } | { error: string }> {
  const sb = getSupabaseAuthClient();
  if (!sb) return { error: "Supabase not configured on server" };

  try {
    const { data, error } = await sb.auth.getUser(accessToken);
    if (error || !data?.user) {
      return { error: `Invalid Supabase session: ${error?.message ?? "No user"}` };
    }
    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        fullName:
          data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "User",
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Token verification failed: ${message}` };
  }
}
