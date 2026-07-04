import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { requestScore, grantPermit } from "../services/contract";
import { v4 as uuid } from "uuid";

const router = Router();

router.use(authenticate);

const LENS_REGISTRY = [
  { lensId: "rental-readiness", name: "Rental-Readiness", description: "For landlords & leasing apps" },
  { lensId: "bnpl-affordability", name: "BNPL Affordability", description: "For buy-now-pay-later apps" },
  { lensId: "credit-tier", name: "Credit Tier", description: "For lenders" },
  { lensId: "budgeting-health", name: "Budgeting Health", description: "Personal financial health" },
];

router.get("/registry", async (_req: Request, res: Response) => {
  res.json({ lenses: LENS_REGISTRY });
});

router.post("/request", async (req: Request, res: Response) => {
  try {
    const { lensId, requesterAppId } = req.body;

    if (!lensId || !requesterAppId) {
      res.status(400).json({ error: "lensId and requesterAppId are required" });
      return;
    }

    const lens = LENS_REGISTRY.find((l) => l.lensId === lensId);
    if (!lens) {
      res.status(404).json({ error: "Lens not found" });
      return;
    }

    res.json({
      message: "Consent required",
      requiresConsent: true,
      lens: { lensId: lens.lensId, name: lens.name },
      requesterAppId,
    });
  } catch (err) {
    console.error("Lens request error:", err);
    res.status(500).json({ error: "Failed to request lens" });
  }
});

router.post("/permit/grant", async (req: Request, res: Response) => {
  try {
    const { lensId, requesterAppId, expiryHours } = req.body;
    const { user } = req;

    if (!lensId || !requesterAppId || !expiryHours) {
      res.status(400).json({ error: "lensId, requesterAppId, and expiryHours are required" });
      return;
    }

    const expiresAt = Math.floor(Date.now() / 1000) + expiryHours * 3600;
    const permitId = uuid();

    const txHash = await grantPermit(
      user!.wallet,
      requesterAppId,
      lensId,
      expiresAt
    );

    res.json({ message: "Permit granted", permitId, txHash, expiresAt });
  } catch (err) {
    console.error("Permit grant error:", err);
    res.status(500).json({ error: "Failed to grant permit" });
  }
});

export default router;
