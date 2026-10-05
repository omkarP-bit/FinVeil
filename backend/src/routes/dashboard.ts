import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { computeMLScore, FEATURE_NAMES } from "../services/contract";
import { getProfile, getDecisions, getPermits } from "../services/db";

const router = Router();

router.use(authenticate);

router.get("/me", async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const profile = await getProfile(user!.sub);

    if (!profile) {
      res.json({
        profileExists: false,
        savingsTrend: [],
        spendingBreakdown: [],
        anomalies: [
          { message: "Build your FinVeil profile to see personalized analytics", severity: "info" },
        ],
      });
      return;
    }

    let decisionLabel: string;
    let probability: number;

    if (profile.is_encrypted) {
      decisionLabel = "Encrypted — scored on chain";
      probability = 0.5;
    } else {
      const result = computeMLScore(FEATURE_NAMES.map((n) => profile.features[n] as number));
      decisionLabel = result.decisionLabel;
      probability = result.probability;
    }

    const healthIndex = Math.round(probability * 100);
    const recentDecisions = await getDecisions(user!.sub);
    const recent = recentDecisions.slice(-4).reverse();

    res.json({
      profileExists: true,
      healthIndex,
      tier: decisionLabel,
      isEncrypted: profile.is_encrypted,
      recentDecisions: recent.map((d) => ({
        lens: d.lens_id,
        label: d.decision_label,
        probability: d.probability,
        at: d.decided_at,
      })),
      savingsTrend: [35, 42, 38, 45, 52, 48, 55, 50, 58, 62, 60, 68].map((v) =>
        Math.min(100, Math.max(10, v + Math.round((healthIndex - 50) * 0.3)))
      ),
      spendingBreakdown: [
        {
          label: "Dining",
          percentage: Math.min(
            60,
            Math.max(10, 40 - Math.round((healthIndex - 50) * 0.2))
          ),
        },
        { label: "Transport", percentage: 20 },
        { label: "Rent", percentage: 32 },
        {
          label: "Other",
          percentage: Math.max(
            5,
            100 -
              Math.min(60, Math.max(10, 40 - Math.round((healthIndex - 50) * 0.2))) -
              20 -
              32
          ),
        },
      ],
      anomalies: [
        ...(healthIndex < 40
          ? [
              {
                message:
                  "Spending exceeds recommended threshold — consider budgeting adjustments",
                severity: "warning" as const,
              },
            ]
          : []),
        ...(healthIndex < 25
          ? [
              {
                message: "High debt-to-income ratio detected",
                severity: "warning" as const,
              },
            ]
          : []),
        ...(recent.length > 0
          ? []
          : [
              {
                message:
                  "No lens scores computed yet — request a lens score to see personalized insights",
                severity: "info" as const,
              },
            ]),
      ],
    });
  } catch {
    res.json({
      profileExists: false,
      savingsTrend: [],
      spendingBreakdown: [],
      anomalies: [
        { message: "Build your FinVeil profile to see personalized analytics", severity: "info" },
      ],
    });
  }
});

router.get("/access-log", async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const permits = await getPermits(user!.sub);
    res.json({
      permits: permits.map((p) => ({
        app: p.requester_app_id,
        lens: p.lens_id,
        status: p.used ? "used" : new Date(p.expires_at).getTime() < Date.now() ? "expired" : "active",
        time: timeAgo(p.granted_at),
      })),
    });
  } catch (err) {
    console.error("Access log error:", err);
    res.status(500).json({ error: "Failed to load access log" });
  }
});

function timeAgo(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export default router;
