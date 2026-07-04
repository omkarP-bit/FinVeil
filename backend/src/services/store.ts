import { v4 as uuid } from "uuid";

export interface StoredProfile {
  userId: string;
  features: Record<string, number>;
  createdAt: string;
}

export interface StoredPermit {
  id: string;
  userId: string;
  lensId: string;
  requesterAppId: string;
  grantedAt: string;
  expiresAt: string;
  used: boolean;
}

export interface StoredDecision {
  id: string;
  userId: string;
  lensId: string;
  decisionLabel: string;
  probability: number;
  createdAt: string;
}

export interface StoredKYC {
  userId: string;
  fields: Record<string, string>;
  createdAt: string;
}

export interface StoredVerificationToken {
  id: string;
  userId: string;
  requesterAppId: string;
  checkId: number;
  result: boolean;
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
  used: boolean;
}

export interface Lens {
  lensId: string;
  name: string;
  description: string;
}

export interface App {
  id: string;
  name: string;
  category: string;
}

export interface StoredUser {
  sub: string;
  email: string;
  name: string;
  wallet: string;
}

const users = new Map<string, StoredUser>();
const profiles = new Map<string, StoredProfile>();
const permits: StoredPermit[] = [];
const decisions: StoredDecision[] = [];
const kycRecords = new Map<string, StoredKYC>();
const verificationTokens: StoredVerificationToken[] = [];

export function saveUser(id: string, user: StoredUser): void {
  users.set(id, user);
}

export function getUser(id: string): StoredUser | undefined {
  return users.get(id);
}

const lenses: Lens[] = [
  { lensId: "rental-readiness", name: "Rental-Readiness", description: "For landlords & leasing apps" },
  { lensId: "bnpl-affordability", name: "BNPL Affordability", description: "For buy-now-pay-later apps" },
  { lensId: "credit-tier", name: "Credit Tier", description: "For lenders" },
  { lensId: "budgeting-health", name: "Budgeting Health", description: "Personal financial health" },
];

const apps: App[] = [
  { id: "greenleaf-rentals", name: "GreenLeaf Rentals", category: "Rental" },
  { id: "paylater-co", name: "PayLater Co.", category: "BNPL" },
  { id: "northgate-bank", name: "Northgate Bank", category: "Lending" },
  { id: "finveil-dashboard", name: "FinVeil Dashboard", category: "Personal" },
];

export function saveProfile(userId: string, features: Record<string, number>): StoredProfile {
  const existing = profiles.get(userId);
  if (existing) {
    Object.assign(existing, { features, createdAt: new Date().toISOString() });
    return existing;
  }
  const profile: StoredProfile = { userId, features, createdAt: new Date().toISOString() };
  profiles.set(userId, profile);
  return profile;
}

export function getProfile(userId: string): StoredProfile | undefined {
  return profiles.get(userId);
}

export function getLenses(): Lens[] {
  return lenses;
}

export function getApps(): App[] {
  return apps;
}

export function addPermit(userId: string, lensId: string, requesterAppId: string, expiresAt: string): StoredPermit {
  const permit: StoredPermit = { id: uuid(), userId, lensId, requesterAppId, grantedAt: new Date().toISOString(), expiresAt, used: false };
  permits.push(permit);
  return permit;
}

export function getPermits(userId: string): StoredPermit[] {
  return permits.filter((p) => p.userId === userId);
}

export function addDecision(userId: string, lensId: string, decisionLabel: string, probability: number): StoredDecision {
  const decision: StoredDecision = { id: uuid(), userId, lensId, decisionLabel, probability, createdAt: new Date().toISOString() };
  decisions.push(decision);
  return decision;
}

export function getDecisions(userId: string): StoredDecision[] {
  return decisions.filter((d) => d.userId === userId);
}

export function saveKYC(userId: string, fields: Record<string, string>): StoredKYC {
  const record: StoredKYC = { userId, fields, createdAt: new Date().toISOString() };
  kycRecords.set(userId, record);
  return record;
}

export function getKYC(userId: string): StoredKYC | undefined {
  return kycRecords.get(userId);
}

export function addVerificationToken(
  userId: string, requesterAppId: string, checkId: number, result: boolean, sessionId: string, expiresAt: string
): StoredVerificationToken {
  const token: StoredVerificationToken = {
    id: uuid(), userId, requesterAppId, checkId, result, sessionId,
    issuedAt: new Date().toISOString(), expiresAt, used: false,
  };
  verificationTokens.push(token);
  return token;
}

export function getVerificationTokens(userId: string): StoredVerificationToken[] {
  return verificationTokens.filter((t) => t.userId === userId);
}
