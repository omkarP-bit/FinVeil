import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { submitProfile } from "../services/contract";

const router = Router();

router.use(authenticate);

router.post("/", async (req: Request, res: Response) => {
  try {
    const { encryptedFields } = req.body;

    if (!encryptedFields || typeof encryptedFields !== "object") {
      res.status(400).json({ error: "encryptedFields object is required" });
      return;
    }

    const required = ["income", "spendVolatility", "debtRatio", "txnHistoryScore"];
    for (const field of required) {
      if (!encryptedFields[field]) {
        res.status(400).json({ error: `Missing field: ${field}` });
        return;
      }
    }

    const txHash = await submitProfile(encryptedFields);

    res.json({ message: "Profile updated", txHash });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  const { user } = req;
  res.json({ exists: !!user, lastUpdatedAt: new Date().toISOString() });
});

export default router;
