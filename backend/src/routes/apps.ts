import { Router, Request, Response } from "express";

const router = Router();

const MOCK_APPS = [
  { id: "greenleaf-rentals", name: "GreenLeaf Rentals", category: "Rental" },
  { id: "paylater-co", name: "PayLater Co.", category: "BNPL" },
  { id: "northgate-bank", name: "Northgate Bank", category: "Lending" },
  { id: "finveil-dashboard", name: "FinVeil Dashboard", category: "Personal" },
];

router.get("/registry", async (_req: Request, res: Response) => {
  res.json({ apps: MOCK_APPS });
});

export default router;
