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

-- ── 5. reports ────────────────────────────────────────────────
-- Stores cryptographic analysis reports
CREATE TABLE IF NOT EXISTS reports (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL DEFAULT 'default-local-user',
  file_name       TEXT NOT NULL,
  type            TEXT NOT NULL,
  file_size       TEXT NOT NULL,
  analysis_date   TEXT NOT NULL,
  security_score  INTEGER NOT NULL,
  status          TEXT NOT NULL,
  entropy         JSONB NOT NULL DEFAULT '{}',
  rsa             JSONB NOT NULL DEFAULT '{}',
  aes             JSONB NOT NULL DEFAULT '{}',
  patterns        JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '[]',
  findings        TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports (user_id);

-- ── 6. cryptographic_keys_v2 ───────────────────────────────────
-- Structured cryptographic key storage
CREATE TABLE IF NOT EXISTS cryptographic_keys_v2 (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL DEFAULT 'default-local-user',
  key_type             TEXT NOT NULL,
  key_value            TEXT NOT NULL,
  key_size             INTEGER NOT NULL,
  label                TEXT NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  document_name        TEXT NOT NULL DEFAULT '',
  plaintext_snippet    TEXT NOT NULL DEFAULT '',
  ciphertext_payload   TEXT NOT NULL DEFAULT '',
  encrypted_session_key TEXT NOT NULL DEFAULT '',
  aes_iv               TEXT NOT NULL DEFAULT '',
  aes_mode             TEXT NOT NULL DEFAULT '',
  paired_key_id        TEXT NOT NULL DEFAULT '',
  generated_at         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cryptographic_keys_v2_user_id ON cryptographic_keys_v2 (user_id);

-- ── 7. cryptographic_keys (legacy v1) ─────────────────────────
-- Legacy fallback table
CREATE TABLE IF NOT EXISTS cryptographic_keys (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL DEFAULT 'default-local-user',
  key_type     TEXT NOT NULL,
  key_value    TEXT NOT NULL,
  key_size     INTEGER NOT NULL,
  label        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  generated_at TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cryptographic_keys_user_id ON cryptographic_keys (user_id);

-- ── 8. unstructured_chunks ────────────────────────────────────
-- Stores extracted text chunks from analyzed documents
CREATE TABLE IF NOT EXISTS unstructured_chunks (
  id        BIGSERIAL PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  chunk_id  INTEGER NOT NULL,
  text      TEXT NOT NULL,
  type      TEXT NOT NULL DEFAULT '',
  length    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_unstructured_chunks_report_id ON unstructured_chunks (report_id);

-- ── 9. structured_parameters ───────────────────────────────────
-- Stores AI-generated structured analysis parameters
CREATE TABLE IF NOT EXISTS structured_parameters (
  id             BIGSERIAL PRIMARY KEY,
  report_id      TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  category       TEXT NOT NULL DEFAULT '',
  element        TEXT NOT NULL DEFAULT '',
  value          TEXT NOT NULL DEFAULT '',
  classification TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_structured_parameters_report_id ON structured_parameters (report_id);

-- ── 10. corrected_documents ────────────────────────────────────
-- Stores garbled text recovery results
CREATE TABLE IF NOT EXISTS corrected_documents (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  original_text  TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  document_name  TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corrected_documents_user_id ON corrected_documents (user_id);

-- ── 11. audio_previews ─────────────────────────────────────────
-- Stores generated audio narration scripts and base64 audio
CREATE TABLE IF NOT EXISTS audio_previews (
  id               BIGSERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL,
  document_name    TEXT NOT NULL DEFAULT '',
  associated_key_id TEXT NOT NULL DEFAULT '',
  prompt           TEXT NOT NULL DEFAULT '',
  audio_base64     TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_previews_user_id ON audio_previews (user_id);

-- ── 12. Enable RLS on new tables ──────────────────────────────
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_reports" ON reports;
CREATE POLICY "allow_all_reports" ON reports
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE cryptographic_keys_v2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_cryptographic_keys_v2" ON cryptographic_keys_v2;
CREATE POLICY "allow_all_cryptographic_keys_v2" ON cryptographic_keys_v2
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE cryptographic_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_cryptographic_keys" ON cryptographic_keys;
CREATE POLICY "allow_all_cryptographic_keys" ON cryptographic_keys
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE unstructured_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_unstructured_chunks" ON unstructured_chunks;
CREATE POLICY "allow_all_unstructured_chunks" ON unstructured_chunks
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE structured_parameters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_structured_parameters" ON structured_parameters;
CREATE POLICY "allow_all_structured_parameters" ON structured_parameters
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE corrected_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_corrected_documents" ON corrected_documents;
CREATE POLICY "allow_all_corrected_documents" ON corrected_documents
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE audio_previews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_audio_previews" ON audio_previews;
CREATE POLICY "allow_all_audio_previews" ON audio_previews
  FOR ALL USING (true) WITH CHECK (true);

-- ── 13. Enable Realtime on new tables ──────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
ALTER PUBLICATION supabase_realtime ADD TABLE cryptographic_keys_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE cryptographic_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE unstructured_chunks;
ALTER PUBLICATION supabase_realtime ADD TABLE structured_parameters;
ALTER PUBLICATION supabase_realtime ADD TABLE corrected_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE audio_previews;

-- ── 14. Verify Tables Created ─────────────────────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('user_devices', 'ephemeral_transfers', 'reports', 'cryptographic_keys_v2', 'cryptographic_keys', 'unstructured_chunks', 'structured_parameters', 'corrected_documents', 'audio_previews')
ORDER BY table_name;
