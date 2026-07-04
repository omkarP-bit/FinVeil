import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import kycRoutes from "../routes/kyc";
import { issueAccessToken } from "../services/auth";

const app = express();
app.use(express.json());
app.use("/kyc", kycRoutes);

function authedPost(url: string, body: any) {
  const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
  return request(app).post(url).send(body).set("Authorization", `Bearer ${token}`);
}

describe("KYC Routes", () => {
  it("POST /kyc/submit — accepts valid KYC submission", async () => {
    // First submit KYC data
    const submitRes = await authedPost("/kyc/submit", {
      fields: {
        nameHash: "alice",
        dobEncoded: "19900101",
        idHash: "alice",
        addressHash: "123 main st",
      },
    });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.message).toBe("KYC data saved");
  });

  it("POST /kyc/submit — rejects missing fields", async () => {
    const res = await authedPost("/kyc/submit", {
      fields: { nameHash: "test" },
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Missing field");
  });

  it("POST /kyc/submit — rejects empty body", async () => {
    const res = await authedPost("/kyc/submit", {});
    expect(res.status).toBe(400);
  });

  it("POST /kyc/verify — performs verification", async () => {
    // Submit KYC first
    await authedPost("/kyc/submit", {
      fields: { nameHash: "alice", dobEncoded: "19900101", idHash: "alice", addressHash: "123 main st" },
    });

    const res = await authedPost("/kyc/verify", {
      checkId: 0,
      requesterAppId: "app-1",
      sessionExpiryMinutes: 30,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Verification performed");
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("sessionId");
    expect(res.body).toHaveProperty("expiresAt");
    expect(res.body.identityVerified).toBe(true);
  });

  it("POST /kyc/verify — rejects invalid checkId", async () => {
    const res = await authedPost("/kyc/verify", {
      checkId: 99,
      requesterAppId: "app-1",
      sessionExpiryMinutes: 30,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid checkId");
  });

  it("POST /kyc/verify — rejects missing fields", async () => {
    const res = await authedPost("/kyc/verify", { checkId: 0 });
    expect(res.status).toBe(400);
  });

  it("POST /kyc/submit — rejects without auth", async () => {
    const res = await request(app).post("/kyc/submit").send({ fields: {} });
    expect(res.status).toBe(401);
  });
});
