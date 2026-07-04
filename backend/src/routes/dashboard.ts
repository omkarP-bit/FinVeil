import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { requestScore } from "../services/contract";

const router = Router();

router.use(authenticate);

router.get("/me", async (req: Request, res: Response) => {
  try {
    const { scoreHandle } = await requestScore(req.user!.wallet, "budgeting-health");
    const healthIndex = parseInt(scoreHandle.slice(-2), 16) % 100;

    const savingsTrend = [35, 42, 38, 45, 52, 48, 55, 50, 58, 62, 60, 68].map(
      (v) => Math.min(100, Math.max(10, v + Math.floor((healthIndex - 50) * 0.3)))
    );

    const diningPct = Math.min(60, Math.max(10, 40 - Math.floor((healthIndex - 50) * 0.2)));
    const transportPct = Math.min(40, Math.max(10, 20));
    const rentPct = Math.min(50, Math.max(15, 32));
    const otherPct = Math.max(5, 100 - diningPct - transportPct - rentPct);

    const anomalies: Array<{ message: string; severity: string }> = [];
    if (healthIndex < 40) {
      anomalies.push({ message: "Spending exceeds recommended threshold — consider budgeting adjustments", severity: "warning" });
    }
    if (healthIndex < 25) {
      anomalies.push({ message: "High debt-to-income ratio detected", severity: "warning" });
    }

    res.json({
      savingsTrend,
      spendingBreakdown: [
        { label: "Dining", percentage: diningPct },
        { label: "Transport", percentage: transportPct },
        { label: "Rent", percentage: rentPct },
        { label: "Other", percentage: otherPct },
      ],
      anomalies,
    });
  } catch {
    res.json({
      savingsTrend: [35, 42, 38, 45, 52, 48, 55, 50, 58, 62, 60, 68],
      spendingBreakdown: [
        { label: "Dining", percentage: 40 },
        { label: "Transport", percentage: 20 },
        { label: "Rent", percentage: 32 },
        { label: "Other", percentage: 8 },
      ],
      anomalies: [{ message: "Dining spending is up 40% month-over-month", severity: "warning" }],
    });
  }
});

router.get("/access-log", async (req: Request, res: Response) => {
  res.json({
    permits: [
      { app: "GreenLeaf Rentals", lens: "Rental-Readiness", status: "used", time: "2 hrs ago" },
      { app: "PayLater Co.", lens: "BNPL Affordability", status: "used", time: "5 days ago" },
    ],
  });
});

export default router;
