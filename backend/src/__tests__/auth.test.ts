import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import authRoutes from "../routes/auth";

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

const mockSbUser = {
  id: "supabase-user-id",
  email: "test@example.com",
  user_metadata: { full_name: "Test User" },
};

vi.mock("../services/supabase", () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      getUser: vi.fn((token: string) => {
        if (token === "valid-sb-token") {
          return Promise.resolve({ data: { user: mockSbUser }, error: null });
        }
        return Promise.resolve({ data: { user: null }, error: new Error("Invalid token") });
      }),
    },
  })),
  upsertUser: vi.fn().mockResolvedValue({
    id: "test-user-id",
    oauth_provider: "google",
    oauth_sub: "supabase-user-id",
    wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
    email: "test@example.com",
    name: "Test User",
  }),
}));

describe("Auth Routes", () => {
  it("POST /auth/supabase — returns tokens on success", async () => {
    const res = await request(app)
      .post("/auth/supabase")
      .send({ accessToken: "valid-sb-token" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user.name).toBe("Test User");
    expect(res.body.profileExists).toBe(false);
  });

  it("POST /auth/supabase — rejects missing accessToken", async () => {
    const res = await request(app)
      .post("/auth/supabase")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("accessToken is required");
  });

  it("POST /auth/supabase — rejects invalid token", async () => {
    const res = await request(app)
      .post("/auth/supabase")
      .send({ accessToken: "invalid-token" });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Invalid Supabase session");
  });

  it("POST /auth/supabase — rejects when Supabase not configured", async () => {
    const { getSupabase } = await import("../services/supabase");
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);

    const res = await request(app)
      .post("/auth/supabase")
      .send({ accessToken: "any-token" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Supabase not configured on server");
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
