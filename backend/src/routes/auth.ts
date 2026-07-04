import { Router, Request, Response } from "express";
import { getSupabase, upsertUser } from "../services/supabase";
import { issueAccessToken, issueRefreshToken, verifyRefreshToken, generateWallet } from "../services/auth";
import { saveUser, getProfile } from "../services/store";

const router = Router();

router.post("/supabase", async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      res.status(400).json({ error: "accessToken is required" });
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      res.status(500).json({ error: "Supabase not configured on server" });
      return;
    }

    let sbUser;
    try {
      const { data, error } = await sb.auth.getUser(accessToken);
      if (error || !data?.user) {
        res.status(401).json({ error: `Invalid Supabase session: ${error?.message ?? "No user"}` });
        return;
      }
      sbUser = data.user;
    } catch (verifyErr: any) {
      res.status(401).json({ error: `Token verification failed: ${verifyErr?.message ?? verifyErr}` });
      return;
    }

    const sub = sbUser.id;
    const email = sbUser.email ?? "";
    const name = sbUser.user_metadata?.full_name ?? sbUser.email?.split("@")[0] ?? "User";

    const wallet = generateWallet();

    let user;
    try {
      user = await upsertUser("google", sub, wallet, email, name);
    } catch (dbErr: any) {
      // Fallback: if upsert fails (e.g. missing columns), return synthetic user
      console.warn("User upsert failed, using fallback:", dbErr?.message);
      user = {
        id: `google_${sub}`,
        oauth_provider: "google",
        oauth_sub: sub,
        wallet_address: wallet,
        email,
        name,
      };
    }

    const accessTokenJwt = issueAccessToken({ sub: user.id, wallet: user.wallet_address ?? wallet });
    const refreshTokenJwt = issueRefreshToken({ sub: user.id, wallet: user.wallet_address ?? wallet });

    saveUser(user.id, { sub, email, name, wallet: user.wallet_address ?? wallet });

    const existingProfile = getProfile(user.id);

    res.json({
      accessToken: accessTokenJwt,
      refreshToken: refreshTokenJwt,
      user: { id: user.id, wallet: user.wallet_address, name, email },
      profileExists: !!existingProfile,
    });
  } catch (err: any) {
    console.error("Supabase auth error:", err);
    res.status(500).json({ error: `Authentication failed: ${err?.message ?? err}` });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
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

export default router;
