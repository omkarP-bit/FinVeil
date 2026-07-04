import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import lensRoutes from "../routes/lens";
import { issueAccessToken } from "../services/auth";

const app = express();
app.use(express.json());
app.use("/lens", lensRoutes);

function authedGet(url: string) {
  const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
  return request(app).get(url).set("Authorization", `Bearer ${token}`);
}

function authedPost(url: string, body: any) {
  const token = issueAccessToken({ sub: "user1", wallet: "0xwallet" });
  return request(app).post(url).send(body).set("Authorization", `Bearer ${token}`);
}

describe("Lens Routes", () => {
  it("GET /lens/registry — returns lenses", async () => {
    const res = await authedGet("/lens/registry");
    expect(res.status).toBe(200);
    expect(res.body.lenses).toHaveLength(4);
    expect(res.body.lenses[0].lensId).toBe("rental-readiness");
  });

  it("GET /lens/registry — rejects without auth", async () => {
    const res = await request(app).get("/lens/registry");
    expect(res.status).toBe(401);
  });

  it("POST /lens/request — requires consent", async () => {
    const res = await authedPost("/lens/request", {
      lensId: "rental-readiness",
      requesterAppId: "app-1",
    });

    expect(res.status).toBe(200);
    expect(res.body.requiresConsent).toBe(true);
  });

  it("POST /lens/request — rejects missing lensId", async () => {
    const res = await authedPost("/lens/request", { requesterAppId: "app-1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("lensId and requesterAppId are required");
  });

  it("POST /lens/request — rejects unknown lens", async () => {
    const res = await authedPost("/lens/request", {
      lensId: "nonexistent",
      requesterAppId: "app-1",
    });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Lens not found");
  });

  it("POST /lens/permit/grant — grants permit", async () => {
    const res = await authedPost("/lens/permit/grant", {
      lensId: "rental-readiness",
      requesterAppId: "app-1",
      expiryHours: 24,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Permit granted");
    expect(res.body).toHaveProperty("permitId");
    expect(res.body).toHaveProperty("expiresAt");
  });

  it("POST /lens/permit/grant — rejects missing fields", async () => {
    const res = await authedPost("/lens/permit/grant", {
      lensId: "rental-readiness",
    });
    expect(res.status).toBe(400);
  });
});
