import { Router, Request, Response } from "express";
import { upsertUser } from "../services/supabase";
import { issueAccessToken, issueRefreshToken, verifyRefreshToken, generateWallet } from "../services/auth";

const router = Router();

router.post("/oauth/callback", async (req: Request, res: Response) => {
  try {
    const { provider, code } = req.body;

    if (!provider || !code) {
      res.status(400).json({ error: "provider and code are required" });
      return;
    }

    const wallet = generateWallet();

    const user = await upsertUser(provider, code, wallet);

    const accessToken = issueAccessToken({ sub: user.id, wallet: user.wallet_address ?? wallet });
    const refreshToken = issueRefreshToken({ sub: user.id, wallet: user.wallet_address ?? wallet });

    res.json({ accessToken, refreshToken, user: { id: user.id, wallet: user.wallet_address } });
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).json({ error: "Authentication failed" });
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
