export type LensId = string;
export type UserId = string;
export type AppId = string;
export type PermitId = string;
export type DecisionId = string;

export interface JWTPayload {
  sub: UserId;
  wallet: string;
  iat: number;
  exp: number;
}

export interface ProfileSubmission {
  duration: string;
  checkNeg: string;
  checkNone: string;
  checkHigh: string;
  creditPaid: string;
  creditNone: string;
}

export interface ModelConstants {
  SCALE: number;
  FEATURE_SCALE: number;
  OFFSET: number;
  POLY_SCALE: number;
  WEIGHTS: number[];
  BIAS: number;
  POLY_COEFFS: number[];
}

export interface LensRequest {
  lensId: LensId;
  requesterAppId: AppId;
  userId: UserId;
}

export interface PermitGrant {
  lensId: LensId;
  requesterAppId: AppId;
  expiryHours: number;
}

export interface Decision {
  id: DecisionId;
  userId: UserId;
  lensId: LensId;
  decisionLabel: string;
  decidedAt: string;
}

export interface KYCRecordSubmission {
  nameHash: string;
  dobEncoded: string;
  idHash: string;
  addressHash: string;
}

export interface VerificationRequest {
  checkId: number;
  requesterAppId: AppId;
  sessionExpiryMinutes: number;
}
