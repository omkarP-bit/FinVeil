import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { computeMLScore, submitProfile } from "../services/contract";
import { getLenses, getProfile, addPermit, addDecision } from "../services/store";
import { v4 as uuid } from "uuid";

const router = Router();

router.use(authenticate);

router.get("/registry", async (_req: Request, res: Response) => {
  res.json({ lenses: getLenses() });
});

router.post("/request", async (req: Request, res: Response) => {
  try {
    const { lensId, requesterAppId } = req.body;

    if (!lensId || !requesterAppId) {
      res.status(400).json({ error: "lensId and requesterAppId are required" });
      return;
    }

    const lens = getLenses().find((l) => l.lensId === lensId);
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

router.post("/score", async (req: Request, res: Response) => {
  try {
    const { lensId } = req.body;
    const { user } = req;

    if (!lensId) {
      res.status(400).json({ error: "lensId is required" });
      return;
    }

    const lens = getLenses().find((l) => l.lensId === lensId);
    if (!lens) {
      res.status(404).json({ error: "Lens not found" });
      return;
    }

    const profile = getProfile(user!.sub);
    if (!profile) {
      res.status(400).json({ error: "No profile found. Build your profile first." });
      return;
    }

    const features = profile.features;
    const firstVal = features[Object.keys(features)[0]];

    // Check if features are encrypted (objects with `data` property)
    const isEncrypted = firstVal && typeof firstVal === "object" && "data" in (firstVal as object);

    if (isEncrypted) {
      const { requestScore: requestScoreOnChain } = await import("../services/contract");
      const result = await requestScoreOnChain(user!.sub, lensId);
      const probability = result ? parseFloat(result.decisionLabel.replace(/[^0-9.]/g, "") || "0.5") / 100 : 0.5;
      addDecision(user!.sub, lensId, result.decisionLabel, probability);
      res.json({ decisionLabel: result.decisionLabel, probability });
    } else {
      const featureValues = [
        features.duration as number,
        features.checkNeg as number,
        features.checkNone as number,
        features.checkHigh as number,
        features.creditPaid as number,
        features.creditNone as number,
      ];

      const { decisionLabel, probability } = computeMLScore(featureValues);
      addDecision(user!.sub, lensId, decisionLabel, probability);

      res.json({ decisionLabel, probability });
    }
  } catch (err) {
    console.error("Score error:", err);
    res.status(500).json({ error: "Failed to compute score" });
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

    const expiresAt = new Date(Date.now() + expiryHours * 3600_000).toISOString();
    const permitId = uuid();

    addPermit(user!.sub, lensId, requesterAppId, expiresAt);

    res.json({ message: "Permit granted", permitId, expiresAt });
  } catch (err) {
    console.error("Permit grant error:", err);
    res.status(500).json({ error: "Failed to grant permit" });
  }
});

export default router;
