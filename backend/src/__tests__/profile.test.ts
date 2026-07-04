import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import profileRoutes from "../routes/profile";
import { issueAccessToken } from "../services/auth";

const app = express();
app.use(express.json());
app.use("/profile", profileRoutes);

function authedRequest() {
  const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
  return request(app)
    .post("/profile")
    .set("Authorization", `Bearer ${token}`);
}

describe("Profile Routes", () => {
  it("POST /profile — rejects without auth", async () => {
    const res = await request(app).post("/profile").send({ features: {} });
    expect(res.status).toBe(401);
  });

  it("POST /profile — accepts valid submission", async () => {
    const res = await authedRequest().send({
      features: {
        duration: 12,
        checkNeg: 0,
        checkNone: 0,
        checkHigh: 1,
        creditPaid: 1,
        creditNone: 0,
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Profile saved");
  });

  it("POST /profile — rejects missing fields", async () => {
    const res = await authedRequest().send({
      features: { duration: 12 },
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
