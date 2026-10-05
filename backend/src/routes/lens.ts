import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import {
  computeMLScore,
  computeDecision,
  isContractConfigured,
  FEATURE_NAMES,
} from "../services/contract";
import { getLensById, getProfile, addPermit, addDecision } from "../services/db";
import { v4 as uuid } from "uuid";

const router = Router();

router.use(authenticate);

router.get("/registry", async (_req: Request, res: Response) => {
  try {
    const { getLenses } = await import("../services/db");
    res.json({ lenses: await getLenses() });
  } catch (err) {
    console.error("Lens registry error:", err);
    res.status(500).json({ error: "Failed to load lens registry" });
  }
});

router.post("/request", async (req: Request, res: Response) => {
  try {
    const { lensId, requesterAppId } = req.body ?? {};

    if (!lensId || !requesterAppId) {
      res.status(400).json({ error: "lensId and requesterAppId are required" });
      return;
    }

    const lens = await getLensById(lensId);
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
    const { lensId } = req.body ?? {};
    const { user } = req;

    if (!lensId) {
      res.status(400).json({ error: "lensId is required" });
      return;
    }

    const lens = await getLensById(lensId);
    if (!lens) {
      res.status(404).json({ error: "Lens not found" });
      return;
    }

    const profile = await getProfile(user!.sub);
    if (!profile) {
      res.status(400).json({ error: "No profile found. Build your profile first." });
      return;
    }

    if (profile.is_encrypted) {
      if (!isContractConfigured()) {
        res.status(503).json({
          error:
            "Profile is encrypted but CONTRACT_ADDRESS is not configured. Deploy FinVeilVault and set CONTRACT_ADDRESS to score on-chain.",
        });
        return;
      }

      const result = await computeDecision(user!.wallet, lensId);
      await addDecision(user!.sub, lensId, result.decisionLabel, tierProbability(result.tier));

      res.json({
        decisionLabel: result.decisionLabel,
        tier: result.tier,
        probability: tierProbability(result.tier),
        source: "on-chain",
        txHash: result.txHash,
      });
      return;
    }

    const featureValues = FEATURE_NAMES.map((name) => profile.features[name] as number);
    const { decisionLabel, probability, tier } = computeMLScore(featureValues);
    await addDecision(user!.sub, lensId, decisionLabel, probability);

    res.json({
      decisionLabel,
      tier,
      probability,
      source: "local",
    });
  } catch (err) {
    console.error("Score error:", err);
    res.status(500).json({ error: "Failed to compute score" });
  }
});

/** Representative probability for an on-chain tier (the label is all the chain discloses). */
function tierProbability(tier: string): number {
  switch (tier) {
    case "A":
      return 0.9;
    case "B":
      return 0.7;
    case "C":
      return 0.5;
    default:
      return 0.2;
  }
}

router.post("/permit/grant", async (req: Request, res: Response) => {
  try {
    const { lensId, requesterAppId, expiryHours } = req.body ?? {};
    const { user } = req;

    if (!lensId || !requesterAppId || !expiryHours) {
      res.status(400).json({ error: "lensId, requesterAppId, and expiryHours are required" });
      return;
    }

    const permit = await addPermit(
      user!.sub,
      lensId,
      requesterAppId,
      new Date(Date.now() + Number(expiryHours) * 3600_000).toISOString()
    );

    res.json({
      message: "Permit granted",
      permitId: permit.id,
      expiresAt: permit.expires_at,
    });
  } catch (err: any) {
    console.error("Permit grant error:", err);
    if (err?.code === "23503") {
      res.status(400).json({ error: "Unknown lens or requester app" });
      return;
    }
    res.status(500).json({ error: "Failed to grant permit" });
  }
});

export default router;
