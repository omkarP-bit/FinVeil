import { Router, Request, Response } from "express";
import {
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
  generateWallet,
  hashPassword,
  verifyPassword,
} from "../services/auth";
import {
  createLocalUser,
  getUserByEmail,
  getProfile,
  upsertOAuthUser,
  type UserRecord,
} from "../services/db";
import { isSupabaseAuthConfigured, verifySupabaseAccessToken } from "../services/supabaseAuth";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function sessionPayload(user: UserRecord) {
  const wallet = user.wallet_address ?? generateWallet();
  return {
    accessToken: issueAccessToken({ sub: user.id, wallet }),
    refreshToken: issueRefreshToken({ sub: user.id, wallet }),
    user: { id: user.id, wallet, name: user.name, email: user.email },
  };
}

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "email and password must be strings" });
      return;
    }

    const user = await getUserByEmail(email.trim());
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    if (!user.password_hash) {
      res.status(401).json({ error: "This account signs in with Google. Use the Google button." });
      return;
    }
    if (!verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const profile = await getProfile(user.id);

    res.json({
      ...sessionPayload(user),
      profileExists: !!profile,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: `Login failed: ${err?.message ?? err}` });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }

    const existing = await getUserByEmail(email.trim());
    if (existing) {
      res.status(409).json({ error: "An account with that email already exists" });
      return;
    }

    const displayName = typeof name === "string" && name.trim() ? name.trim() : email.split("@")[0];
    const user = await createLocalUser(
      email.trim(),
      hashPassword(password),
      displayName,
      generateWallet()
    );

    res.status(201).json({
      ...sessionPayload(user),
      profileExists: false,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "An account with that email already exists" });
      return;
    }
    console.error("Register error:", err);
    res.status(500).json({ error: `Registration failed: ${err?.message ?? err}` });
  }
});

// Google/Supabase OAuth exchange. Only active when Supabase credentials are present;
// local email/password login is the default path.
router.post("/supabase", async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body ?? {};
    if (!accessToken) {
      res.status(400).json({ error: "accessToken is required" });
      return;
    }
    if (!isSupabaseAuthConfigured()) {
      res.status(501).json({ error: "Supabase not configured on server" });
      return;
    }

    const result = await verifySupabaseAccessToken(accessToken);
    if ("error" in result) {
      res.status(401).json({ error: result.error });
      return;
    }

    const { id: sub, email, fullName } = result.user;

    let user: UserRecord;
    try {
      user = await upsertOAuthUser("google", sub, email || `${sub}@oauth.local`, fullName, generateWallet());
    } catch (dbErr: any) {
      console.warn("OAuth user upsert failed, using existing-or-synthetic user:", dbErr?.message);
      const existing = await getUserByEmail(email || `${sub}@oauth.local`);
      if (!existing) {
        res.status(500).json({ error: "Could not provision account" });
        return;
      }
      user = existing;
    }

    const profile = await getProfile(user.id);

    res.json({
      ...sessionPayload(user),
      profileExists: !!profile,
    });
  } catch (err: any) {
    console.error("Supabase auth error:", err);
    res.status(500).json({ error: `Authentication failed: ${err?.message ?? err}` });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      res.status(400).json({ error: "refreshToken is required" });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const accessToken = issueAccessToken({ sub: payload.sub, wallet: payload.wallet });

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.get("/config", (_req: Request, res: Response) => {
  res.json({
    localAuthEnabled: true,
    googleAuthEnabled: isSupabaseAuthConfigured(),
  });
});

export default router;
