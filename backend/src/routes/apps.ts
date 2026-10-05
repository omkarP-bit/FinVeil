import { Router, Request, Response } from "express";
import { getApps } from "../services/db";

const router = Router();

router.get("/registry", async (_req: Request, res: Response) => {
  try {
    res.json({ apps: await getApps() });
  } catch (err) {
    console.error("Apps registry error:", err);
    res.status(500).json({ error: "Failed to load apps registry" });
  }
});

export default router;
