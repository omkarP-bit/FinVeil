import { Router, Request, Response } from "express";
import { upsertUser } from "../services/supabase";
import { issueAccessToken, issueRefreshToken, generateWallet } from "../services/auth";

const router = Router();

const DEMO_USERS = [
  {
    name: "Alice (High Earner)",
    profile: { income: 120000, spendVolatility: 20, debtRatio: 15, txnHistoryScore: 5 },
  },
  {
    name: "Bob (Medium Earner)",
    profile: { income: 55000, spendVolatility: 50, debtRatio: 35, txnHistoryScore: 3 },
  },
  {
    name: "Charlie (High Risk)",
    profile: { income: 25000, spendVolatility: 85, debtRatio: 65, txnHistoryScore: 1 },
  },
];

router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const users = await Promise.all(
      DEMO_USERS.map(async (demo) => {
        const wallet = generateWallet();
        const user = await upsertUser("demo", demo.name.toLowerCase().replace(/\s+/g, "-"), wallet);
        const accessToken = issueAccessToken({ sub: user.id, wallet });
        const refreshToken = issueRefreshToken({ sub: user.id, wallet });
        return {
          name: demo.name,
          profile: demo.profile,
          user: { id: user.id, wallet },
          tokens: { accessToken, refreshToken },
        };
      })
    );

    res.json({ message: "Demo data seeded", users });
  } catch (err) {
    console.error("Demo seed error:", err);
    res.status(500).json({ error: "Failed to seed demo data" });
  }
});

export default router;
