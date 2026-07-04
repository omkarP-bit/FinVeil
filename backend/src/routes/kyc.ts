import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { submitKYC, requestVerification } from "../services/contract";
import { v4 as uuid } from "uuid";

const router = Router();

router.use(authenticate);

router.post("/submit", async (req: Request, res: Response) => {
  try {
    const { encryptedFields } = req.body;

    if (!encryptedFields || typeof encryptedFields !== "object") {
      res.status(400).json({ error: "encryptedFields object is required" });
      return;
    }

    const required = ["nameHash", "dobEncoded", "idHash", "addressHash"];
    for (const field of required) {
      if (!encryptedFields[field]) {
        res.status(400).json({ error: `Missing field: ${field}` });
        return;
      }
    }

    const txHash = await submitKYC(encryptedFields);

    res.json({ message: "KYC submitted", txHash });
  } catch (err) {
    console.error("KYC submit error:", err);
    res.status(500).json({ error: "Failed to submit KYC" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { checkId, requesterAppId, sessionExpiryMinutes } = req.body;
    const { user } = req;

    if (checkId === undefined || !requesterAppId || !sessionExpiryMinutes) {
      res.status(400).json({ error: "checkId, requesterAppId, and sessionExpiryMinutes are required" });
      return;
    }

    const validCheckIds = [0, 1, 2, 3];
    if (!validCheckIds.includes(checkId)) {
      res.status(400).json({ error: "Invalid checkId. Must be 0 (Identity), 1 (Age18+), 2 (Age21+), or 3 (AML)" });
      return;
    }

    const { sessionId, resultHandle } = await requestVerification(
      user!.wallet,
      checkId,
      requesterAppId,
      sessionExpiryMinutes
    );

    const token = uuid();
    const expiresAt = new Date(Date.now() + sessionExpiryMinutes * 60 * 1000).toISOString();

    res.json({
      message: "Verification performed",
      token,
      sessionId,
      resultHandle,
      expiresAt,
    });
  } catch (err) {
    console.error("KYC verify error:", err);
    res.status(500).json({ error: "Failed to verify KYC" });
  }
});

export default router;
