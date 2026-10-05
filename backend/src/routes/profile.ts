import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { saveProfile, getProfile, type FeatureMap } from "../services/db";

const router = Router();

const REQUIRED_FEATURES = [
  "duration",
  "checkNeg",
  "checkNone",
  "checkHigh",
  "creditPaid",
  "creditNone",
] as const;

router.use(authenticate);

router.post("/", async (req: Request, res: Response) => {
  try {
    const { features } = req.body ?? {};
    const { user } = req;

    if (!features || typeof features !== "object" || Array.isArray(features)) {
      res.status(400).json({ error: "features object is required" });
      return;
    }

    for (const field of REQUIRED_FEATURES) {
      const value = (features as Record<string, unknown>)[field];
      if (value === undefined || value === null) {
        res.status(400).json({ error: `Missing field: ${field}` });
        return;
      }
    }

    await saveProfile(user!.sub, features as FeatureMap);

    res.json({ message: "Profile saved", features });
  } catch (err) {
    console.error("Profile save error:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const profile = await getProfile(user!.sub);
    res.json({
      exists: !!profile,
      lastUpdatedAt: profile ? profile.last_updated_at : null,
      isEncrypted: profile ? profile.is_encrypted : false,
    });
  } catch (err) {
    console.error("Profile status error:", err);
    res.status(500).json({ error: "Failed to load profile status" });
  }
});

export default router;
