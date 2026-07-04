import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import authRoutes from "../routes/auth";

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

vi.mock("../services/supabase", () => ({
  upsertUser: vi.fn().mockResolvedValue({
    id: "test-user-id",
    oauth_provider: "google",
    oauth_sub: "test-sub",
    wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
  }),
}));

describe("Auth Routes", () => {
  it("POST /auth/oauth/callback — returns tokens on success", async () => {
    const res = await request(app)
      .post("/auth/oauth/callback")
      .send({ provider: "google", code: "test-code" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user.id).toBe("test-user-id");
  });

  it("POST /auth/oauth/callback — rejects missing fields", async () => {
    const res = await request(app)
      .post("/auth/oauth/callback")
      .send({ provider: "google" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("provider and code are required");
  });

  it("POST /auth/oauth/callback — rejects empty body", async () => {
    const res = await request(app)
      .post("/auth/oauth/callback")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("provider and code are required");
  });

  it("POST /auth/refresh — returns new access token", async () => {
    const { issueRefreshToken } = await import("../services/auth");
    const refreshToken = issueRefreshToken({ sub: "user1", wallet: "0xwallet" });

    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("POST /auth/refresh — rejects missing token", async () => {
    const res = await request(app).post("/auth/refresh").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("refreshToken is required");
  });

  it("POST /auth/refresh — rejects invalid token", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "invalid-token" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired refresh token");
  });
});
