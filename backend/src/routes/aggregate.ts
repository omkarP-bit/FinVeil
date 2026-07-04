import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { getDecisions } from "../services/store";

const router = Router();

router.use(authenticate);

router.get("/:lensId", async (req: Request, res: Response) => {
  try {
    const { lensId } = req.params;
    const { user } = req;

    const allDecisions = getDecisions(user!.sub);
    const lensDecisions = allDecisions.filter((d) => d.lensId === lensId);

    const tierCounts: Record<string, number> = {};
    for (const d of lensDecisions) {
      const label = d.decisionLabel;
      const simple = label.startsWith("Tier A") ? "A" : label.startsWith("Tier B") ? "B" : label.startsWith("Tier C") ? "C" : "Declined";
      tierCounts[simple] = (tierCounts[simple] || 0) + 1;
    }

    res.json({
      lensId,
      totalRequests: lensDecisions.length,
      tierDistribution: tierCounts,
      lastScoredAt: lensDecisions.length > 0 ? lensDecisions[lensDecisions.length - 1].createdAt : null,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch aggregate stats" });
  }
});

export default router;
