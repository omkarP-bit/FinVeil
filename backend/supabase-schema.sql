-- FinVeil Supabase Schema
-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oauth_provider TEXT NOT NULL,
  oauth_sub TEXT NOT NULL,
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(oauth_provider, oauth_sub)
);

CREATE TABLE profiles_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_updated_at TIMESTAMPTZ,
  contract_profile_tx_hash TEXT,
  UNIQUE(user_id)
);

CREATE TABLE lens_registry (
  lens_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  requester_app_id TEXT NOT NULL
);

CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  allowed_lenses TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE permits_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lens_id TEXT NOT NULL REFERENCES lens_registry(lens_id),
  requester_app_id UUID NOT NULL REFERENCES apps(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lens_id TEXT NOT NULL REFERENCES lens_registry(lens_id),
  decision_label TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kyc_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_updated_at TIMESTAMPTZ,
  contract_kyc_tx_hash TEXT,
  UNIQUE(user_id)
);

CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_app_id UUID NOT NULL REFERENCES apps(id),
  check_id INTEGER NOT NULL,
  result TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false
);

-- Seed default lens registry
INSERT INTO lens_registry (lens_id, name, description, requester_app_id) VALUES
  ('rental-readiness', 'Rental-Readiness', 'For landlords & leasing apps', 'system'),
  ('bnpl-affordability', 'BNPL Affordability', 'For buy-now-pay-later apps', 'system'),
  ('credit-tier', 'Credit Tier', 'For lenders', 'system'),
  ('budgeting-health', 'Budgeting Health', 'Personal financial health dashboard', 'system');
