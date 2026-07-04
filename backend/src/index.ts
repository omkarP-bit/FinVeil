import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

import authRoutes from "./routes/auth";
import lensRoutes from "./routes/lens";
import profileRoutes from "./routes/profile";
import dashboardRoutes from "./routes/dashboard";
import kycRoutes from "./routes/kyc";

import verifyRoutes from "./routes/verify";
import appsRoutes from "./routes/apps";
import { rateLimit } from "./middleware/rateLimit";

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/lens", lensRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/kyc", kycRoutes);

app.use("/verify", verifyRoutes);
app.use("/apps", appsRoutes);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`FinVeil backend running on port ${PORT}`);
  });
}

export default app;
