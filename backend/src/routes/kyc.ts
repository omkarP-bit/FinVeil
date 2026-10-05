import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { saveKYC, getKYC, addVerificationToken, type EncryptedField } from "../services/db";
import { v4 as uuid } from "uuid";

const router = Router();

const REQUIRED_FIELDS = ["nameHash", "dobEncoded", "idHash", "addressHash"] as const;

router.use(authenticate);

router.post("/submit", async (req: Request, res: Response) => {
  try {
    const { fields } = req.body ?? {};
    const { user } = req;

    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      res.status(400).json({ error: "fields object is required" });
      return;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!fields[field]) {
        res.status(400).json({ error: `Missing field: ${field}` });
        return;
      }
    }

    await saveKYC(user!.sub, fields as Record<string, string | EncryptedField>);

    res.json({ message: "KYC data saved" });
  } catch (err) {
    console.error("KYC submit error:", err);
    res.status(500).json({ error: "Failed to submit KYC" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { checkId, requesterAppId, sessionExpiryMinutes } = req.body ?? {};
    const { user } = req;

    if (checkId === undefined || !requesterAppId || !sessionExpiryMinutes) {
      res.status(400).json({ error: "checkId, requesterAppId, and sessionExpiryMinutes are required" });
      return;
    }

    if (![0, 1, 2, 3].includes(Number(checkId))) {
      res.status(400).json({ error: "Invalid checkId. Must be 0 (Identity), 1 (Age18+), 2 (Age21+), or 3 (AML)" });
      return;
    }

    const kyc = await getKYC(user!.sub);
    if (!kyc) {
      res.status(400).json({ error: "No KYC record found. Submit KYC first." });
      return;
    }
    if (kyc.is_encrypted) {
      res.status(400).json({
        error:
          "KYC is encrypted — identity and age checks run on-chain and cannot be evaluated by the server.",
      });
      return;
    }

    const fields = kyc.fields as Record<string, string>;
    const numericCheckId = Number(checkId);

    let passed = false;
    if (numericCheckId === 0) {
      passed = fields.nameHash === fields.idHash;
    } else if (numericCheckId === 1 || numericCheckId === 2) {
      const cutoff = numericCheckId === 1 ? 18 : 21;
      const dob = parseInt(fields.dobEncoded, 10);
      passed = !isNaN(dob) && new Date().getFullYear() - Math.floor(dob / 10000) >= cutoff;
    } else {
      passed = true;
    }

    const sessionId = uuid();
    const token = uuid();
    const expiresAt = new Date(Date.now() + Number(sessionExpiryMinutes) * 60_000).toISOString();

    await addVerificationToken(user!.sub, requesterAppId, numericCheckId, passed, sessionId, expiresAt);

    res.json({
      message: "Verification performed",
      token,
      sessionId,
      identityVerified: numericCheckId === 0 ? passed : undefined,
      ageMet: numericCheckId === 1 || numericCheckId === 2 ? passed : undefined,
      amlPassed: numericCheckId === 3 ? passed : undefined,
      expiresAt,
    });
  } catch (err: any) {
    console.error("KYC verify error:", err);
    if (err?.code === "23503") {
      res.status(400).json({ error: "Unknown requester app" });
      return;
    }
    res.status(500).json({ error: "Failed to verify KYC" });
  }
});

export default router;
