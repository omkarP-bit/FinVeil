import { Router, Request, Response } from "express";
import { getApps } from "../services/store";

const router = Router();

router.get("/registry", async (_req: Request, res: Response) => {
  res.json({ apps: getApps() });
});

export default router;
