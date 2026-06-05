-- ============================================================
-- CipherVault — Complete Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- This is safe to re-run — uses CREATE TABLE IF NOT EXISTS
-- ============================================================

-- ── 1. user_devices ──────────────────────────────────────────
-- Stores every mobile device paired with a web user
CREATE TABLE IF NOT EXISTS user_devices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  device_name  TEXT NOT NULL,
  public_key   TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices (user_id);

-- ── 2. ephemeral_transfers ────────────────────────────────────
-- Stores encrypted payloads sent from web to mobile (burn-after-reading)
CREATE TABLE IF NOT EXISTS ephemeral_transfers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id             UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
  encrypted_payload     TEXT NOT NULL,
  encrypted_session_key TEXT NOT NULL DEFAULT '',
  aes_iv                TEXT NOT NULL DEFAULT '',
  aes_mode              TEXT NOT NULL DEFAULT 'GCM',
  document_name         TEXT NOT NULL DEFAULT 'Encrypted Document',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by device
CREATE INDEX IF NOT EXISTS idx_ephemeral_transfers_device_id ON ephemeral_transfers (device_id);

-- ── 3. Row Level Security ─────────────────────────────────────
-- Allow anon key to read/write (mobile app uses anon key without auth session)

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts on re-run
DROP POLICY IF EXISTS "allow_all_user_devices" ON user_devices;
CREATE POLICY "allow_all_user_devices" ON user_devices
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE ephemeral_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_ephemeral_transfers" ON ephemeral_transfers;
CREATE POLICY "allow_all_ephemeral_transfers" ON ephemeral_transfers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 4. Enable Realtime ────────────────────────────────────────
-- Required for the mobile inbox to receive live push notifications

ALTER PUBLICATION supabase_realtime ADD TABLE ephemeral_transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE user_devices;

-- ── 5. Verify Tables Created ─────────────────────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('user_devices', 'ephemeral_transfers')
ORDER BY table_name;
