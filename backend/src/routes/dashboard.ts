import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { computeMLScore } from "../services/contract";
import { getProfile, getDecisions, getPermits } from "../services/store";

const router = Router();

router.use(authenticate);

router.get("/me", async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const profile = getProfile(user!.sub);

    if (!profile) {
      res.json({
        profileExists: false,
        savingsTrend: [],
        spendingBreakdown: [],
        anomalies: [{ message: "Build your FinVeil profile to see personalized analytics", severity: "info" }],
      });
      return;
    }

    const features = [
      profile.features.duration,
      profile.features.checkNeg,
      profile.features.checkNone,
      profile.features.checkHigh,
      profile.features.creditPaid,
      profile.features.creditNone,
    ];

    const { decisionLabel, probability } = computeMLScore(features);

    const healthIndex = Math.round(probability * 100);

    const recentDecisions = getDecisions(user!.sub).slice(-4);

    res.json({
      profileExists: true,
      healthIndex,
      tier: decisionLabel,
      savingsTrend: [35, 42, 38, 45, 52, 48, 55, 50, 58, 62, 60, 68].map(
        (v) => Math.min(100, Math.max(10, v + Math.round((healthIndex - 50) * 0.3)))
      ),
      spendingBreakdown: [
        { label: "Dining", percentage: Math.min(60, Math.max(10, 40 - Math.round((healthIndex - 50) * 0.2))) },
        { label: "Transport", percentage: 20 },
        { label: "Rent", percentage: 32 },
        { label: "Other", percentage: Math.max(5, 100 - Math.min(60, Math.max(10, 40 - Math.round((healthIndex - 50) * 0.2))) - 20 - 32) },
      ],
      anomalies: [
        ...(healthIndex < 40 ? [{ message: "Spending exceeds recommended threshold — consider budgeting adjustments", severity: "warning" as const }] : []),
        ...(healthIndex < 25 ? [{ message: "High debt-to-income ratio detected", severity: "warning" as const }] : []),
        ...(recentDecisions.length > 0 ? [] : [{ message: "No lens scores computed yet — request a lens score to see personalized insights", severity: "info" as const }]),
      ],
    });
  } catch {
    res.json({
      profileExists: false,
      savingsTrend: [],
      spendingBreakdown: [],
      anomalies: [{ message: "Build your FinVeil profile to see personalized analytics", severity: "info" }],
    });
  }
});

router.get("/access-log", async (req: Request, res: Response) => {
  const { user } = req;
  const userPermits = getPermits(user!.sub).map((p) => ({
    app: p.requesterAppId,
    lens: p.lensId,
    status: p.used ? "used" : "active",
    time: timeAgo(p.grantedAt),
  }));
  res.json({ permits: userPermits });
});

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export default router;
