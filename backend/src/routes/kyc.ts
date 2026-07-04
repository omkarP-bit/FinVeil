import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { saveKYC, getKYC, addVerificationToken } from "../services/store";
import { v4 as uuid } from "uuid";

const router = Router();

router.use(authenticate);

router.post("/submit", async (req: Request, res: Response) => {
  try {
    const { fields } = req.body;
    const { user } = req;

    if (!fields || typeof fields !== "object") {
      res.status(400).json({ error: "fields object is required" });
      return;
    }

    const required = ["nameHash", "dobEncoded", "idHash", "addressHash"];
    for (const field of required) {
      if (!fields[field]) {
        res.status(400).json({ error: `Missing field: ${field}` });
        return;
      }
    }

    saveKYC(user!.sub, fields);

    res.json({ message: "KYC data saved" });
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

    const kyc = getKYC(user!.sub);
    if (!kyc) {
      res.status(400).json({ error: "No KYC record found. Submit KYC first." });
      return;
    }

    let passed = false;
    if (checkId === 0) {
      passed = kyc.fields.nameHash === kyc.fields.idHash;
    } else if (checkId === 1 || checkId === 2) {
      const now = new Date();
      const cutoff = checkId === 1 ? 18 : 21;
      const dob = parseInt(kyc.fields.dobEncoded, 10);
      passed = !isNaN(dob) && (now.getFullYear() - Math.floor(dob / 10000)) >= cutoff;
    } else if (checkId === 3) {
      passed = true;
    }

    const sessionId = uuid();
    const token = uuid();
    const expiresAt = new Date(Date.now() + sessionExpiryMinutes * 60_000).toISOString();

    addVerificationToken(user!.sub, requesterAppId, checkId, passed, sessionId, expiresAt);

    res.json({
      message: "Verification performed",
      token,
      sessionId,
      identityVerified: checkId === 0 ? passed : undefined,
      ageMet: checkId === 1 || checkId === 2 ? passed : undefined,
      amlPassed: checkId === 3 ? passed : undefined,
      expiresAt,
    });
  } catch (err) {
    console.error("KYC verify error:", err);
    res.status(500).json({ error: "Failed to verify KYC" });
  }
});

export default router;
