import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import profileRoutes from "../routes/profile";
import { issueAccessToken } from "../services/auth";

const app = express();
app.use(express.json());
app.use("/profile", profileRoutes);

vi.mock("../services/contract", () => ({
  submitProfile: vi.fn().mockResolvedValue("0xmock_tx_hash"),
}));

function authedRequest() {
  const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
  return request(app)
    .post("/profile")
    .set("Authorization", `Bearer ${token}`);
}

describe("Profile Routes", () => {
  it("POST /profile — rejects without auth", async () => {
    const res = await request(app).post("/profile").send({ encryptedFields: {} });
    expect(res.status).toBe(401);
  });

  it("POST /profile — accepts valid submission", async () => {
    const res = await authedRequest().send({
      encryptedFields: {
        income: "0xenc1",
        spendVolatility: "0xenc2",
        debtRatio: "0xenc3",
        txnHistoryScore: "0xenc4",
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Profile updated");
    expect(res.body.txHash).toBe("0xmock_tx_hash");
  });

  it("POST /profile — rejects missing fields", async () => {
    const res = await authedRequest().send({
      encryptedFields: { income: "0xenc1" },
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Missing field");
  });

  it("POST /profile — rejects empty body", async () => {
    const res = await authedRequest().send({});
    expect(res.status).toBe(400);
  });

  it("GET /profile/status — returns status", async () => {
    const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
    const res = await request(app)
      .get("/profile/status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("exists");
    expect(res.body).toHaveProperty("lastUpdatedAt");
  });
});
