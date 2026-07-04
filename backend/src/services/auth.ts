import jwt from "jsonwebtoken";
import { JWTPayload } from "../types";

function getSecret(name: string): string {
  const secret = process.env[name];
  if (!secret) throw new Error(`${name} not configured`);
  return secret;
}

function parseExpiry(value: string | undefined, fallback: string): number {
  const raw = value || fallback;
  const match = raw.match(/^(\d+)(m|h|d|s)$/);
  if (!match) return 900;
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return num;
    case "m": return num * 60;
    case "h": return num * 3600;
    case "d": return num * 86400;
    default: return 900;
  }
}

export function issueAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const secret = getSecret("JWT_ACCESS_SECRET");
  const expiry = parseExpiry(process.env.JWT_ACCESS_EXPIRY, "15m");
  return jwt.sign(payload, secret, { expiresIn: expiry });
}

export function issueRefreshToken(payload: Pick<JWTPayload, "sub" | "wallet">): string {
  const secret = getSecret("JWT_REFRESH_SECRET");
  const expiry = parseExpiry(process.env.JWT_REFRESH_EXPIRY, "7d");
  return jwt.sign(payload, secret, { expiresIn: expiry });
}

export function verifyRefreshToken(token: string): Pick<JWTPayload, "sub" | "wallet"> {
  const secret = getSecret("JWT_REFRESH_SECRET");
  return jwt.verify(token, secret) as Pick<JWTPayload, "sub" | "wallet">;
}

export function verifyAccessToken(token: string): JWTPayload {
  const secret = getSecret("JWT_ACCESS_SECRET");
  return jwt.verify(token, secret) as JWTPayload;
}

export function generateWallet(): string {
  return "0x" + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
