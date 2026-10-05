import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { getDecisions, getLensById } from "../services/db";

const router = Router();

router.use(authenticate);

router.get("/:lensId", async (req: Request, res: Response) => {
  try {
    const { lensId } = req.params;
    const { user } = req;
    const lensKey = Array.isArray(lensId) ? lensId[0] : lensId;

    const lens = await getLensById(lensKey);
    if (!lens) {
      res.status(404).json({ error: "Lens not found" });
      return;
    }

    const decisions = (await getDecisions(user!.sub)).filter((d) => d.lens_id === lensKey);

    const tierCounts: Record<string, number> = {};
    for (const d of decisions) {
      const label = d.decision_label;
      const simple = label.startsWith("Tier A")
        ? "A"
        : label.startsWith("Tier B")
          ? "B"
          : label.startsWith("Tier C")
            ? "C"
            : "Declined";
      tierCounts[simple] = (tierCounts[simple] || 0) + 1;
    }

    res.json({
      lensId: lensKey,
      totalRequests: decisions.length,
      tierDistribution: tierCounts,
      lastScoredAt: decisions.length > 0 ? decisions[decisions.length - 1].decided_at : null,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch aggregate stats" });
  }
});

export default router;
