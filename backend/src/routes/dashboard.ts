import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/me", async (req: Request, res: Response) => {
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
