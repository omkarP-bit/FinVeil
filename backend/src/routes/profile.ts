import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { saveProfile, getProfile } from "../services/store";

const router = Router();

router.use(authenticate);

router.post("/", async (req: Request, res: Response) => {
  try {
    const { features } = req.body;
    const { user } = req;

    if (!features || typeof features !== "object") {
      res.status(400).json({ error: "features object is required" });
      return;
    }

    const required = ["duration", "checkNeg", "checkNone", "checkHigh", "creditPaid", "creditNone"];
    for (const field of required) {
      if (features[field] === undefined || features[field] === null) {
        res.status(400).json({ error: `Missing field: ${field}` });
        return;
      }
    }

    const numericFeatures: Record<string, number> = {};
    for (const field of required) {
      numericFeatures[field] = Number(features[field]);
    }

    saveProfile(user!.sub, numericFeatures);

    res.json({ message: "Profile saved", features: numericFeatures });
  } catch (err) {
    console.error("Profile save error:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  const { user } = req;
  const profile = getProfile(user!.sub);
  res.json({ exists: !!profile, lastUpdatedAt: profile?.createdAt ?? null });
});

export default router;
