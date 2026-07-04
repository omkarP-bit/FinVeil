import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import dashboardRoutes from "../routes/dashboard";
import { issueAccessToken } from "../services/auth";

const app = express();
app.use(express.json());
app.use("/dashboard", dashboardRoutes);

function authedGet(url: string) {
  const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
  return request(app).get(url).set("Authorization", `Bearer ${token}`);
}

describe("Dashboard Routes", () => {
  it("GET /dashboard/me — returns dashboard data", async () => {
    const res = await authedGet("/dashboard/me");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("savingsTrend");
    expect(res.body).toHaveProperty("spendingBreakdown");
    expect(res.body).toHaveProperty("anomalies");
    expect(res.body.spendingBreakdown).toHaveLength(4);
  });

  it("GET /dashboard/me — rejects without auth", async () => {
    const res = await request(app).get("/dashboard/me");
    expect(res.status).toBe(401);
  });

  it("GET /dashboard/access-log — returns log", async () => {
    const res = await authedGet("/dashboard/access-log");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("permits");
    expect(res.body.permits).toHaveLength(2);
  });

  it("GET /dashboard/access-log — rejects without auth", async () => {
    const res = await request(app).get("/dashboard/access-log");
    expect(res.status).toBe(401);
  });
});
