import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { authenticate } from "../middleware/auth";
import { issueAccessToken } from "../services/auth";

const app = express();
app.get("/test", authenticate, (req, res) => {
  res.json({ user: req.user });
});

describe("Auth Middleware", () => {
  it("accepts valid token", async () => {
    const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
    const res = await request(app)
      .get("/test")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.sub).toBe("user1");
    expect(res.body.user.wallet).toBe("0xwallet");
  });

  it("rejects missing auth header", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing or invalid authorization header");
  });

  it("rejects malformed header", async () => {
    const res = await request(app)
      .get("/test")
      .set("Authorization", "not-bearer token");

    expect(res.status).toBe(401);
  });

  it("rejects invalid token", async () => {
    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });

  it("rejects expired token", async () => {
    const jwt = await import("jsonwebtoken");
    const expired = jwt.default.sign(
      { sub: "user1", wallet: "0xwallet" },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "0s" }
    );

    await new Promise((r) => setTimeout(r, 100));

    const res = await request(app)
      .get("/test")
      .set("Authorization", `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });
});
