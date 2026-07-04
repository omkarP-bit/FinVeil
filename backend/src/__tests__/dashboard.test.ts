import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import dashboardRoutes from "../routes/dashboard";
import { issueAccessToken } from "../services/auth";
import { saveProfile, addPermit, addDecision } from "../services/store";

const app = express();
app.use(express.json());
app.use("/dashboard", dashboardRoutes);

function authedGet(url: string) {
  const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
  return request(app).get(url).set("Authorization", `Bearer ${token}`);
}

describe("Dashboard Routes", () => {
  it("GET /dashboard/me — returns dashboard data when profile exists", async () => {
    saveProfile("user1", { duration: 12, checkNeg: 0, checkNone: 0, checkHigh: 1, creditPaid: 1, creditNone: 0 });

    const res = await authedGet("/dashboard/me");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("savingsTrend");
    expect(res.body.savingsTrend).toHaveLength(12);
    expect(res.body).toHaveProperty("spendingBreakdown");
    expect(res.body.spendingBreakdown).toHaveLength(4);
    expect(res.body).toHaveProperty("anomalies");
    expect(res.body.profileExists).toBe(true);
    expect(res.body).toHaveProperty("healthIndex");
    expect(res.body).toHaveProperty("tier");
  });

  it("GET /dashboard/me — returns empty data when no profile exists", async () => {
    const token = issueAccessToken({ sub: "no-profile-user", wallet: "0xwallet" });
    const res = await request(app)
      .get("/dashboard/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profileExists).toBe(false);
    expect(res.body.savingsTrend).toHaveLength(0);
    expect(res.body.spendingBreakdown).toHaveLength(0);
  });

  it("GET /dashboard/me — rejects without auth", async () => {
    const res = await request(app).get("/dashboard/me");
    expect(res.status).toBe(401);
  });

  it("GET /dashboard/access-log — returns log", async () => {
    addPermit("user1", "rental-readiness", "greenleaf-rentals", new Date(Date.now() + 86400000).toISOString());
    addPermit("user1", "credit-tier", "northgate-bank", new Date(Date.now() + 86400000).toISOString());

    const res = await authedGet("/dashboard/access-log");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("permits");
    expect(res.body.permits).toHaveLength(2);
  });

  it("GET /dashboard/access-log — returns empty when no permits", async () => {
    const token = issueAccessToken({ sub: "no-permits-user", wallet: "0xwallet" });
    const res = await request(app)
      .get("/dashboard/access-log")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.permits).toHaveLength(0);
  });

  it("GET /dashboard/access-log — rejects without auth", async () => {
    const res = await request(app).get("/dashboard/access-log");
    expect(res.status).toBe(401);
  });
});
