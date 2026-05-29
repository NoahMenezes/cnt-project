-- ─── Supabase Table Setup for Structured Cryptographic Key Storage (V2) ────────
-- Run these SQL commands in your Supabase SQL editor to create the new table.
-- Navigate to: Supabase Dashboard > Your Project > SQL Editor > New Query

-- 1. Drop and recreate the structured cryptographic_keys_v2 table cleanly
DROP TABLE IF EXISTS cryptographic_keys_v2;

CREATE TABLE cryptographic_keys_v2 (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('RSA_PUBLIC', 'RSA_PRIVATE', 'AES_SESSION')),
  key_value TEXT NOT NULL,
  key_size INTEGER NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  document_name TEXT DEFAULT '',
  plaintext_snippet TEXT DEFAULT '',
  ciphertext_payload TEXT DEFAULT '',
  encrypted_session_key TEXT DEFAULT '',
  aes_iv TEXT DEFAULT '',
  aes_mode TEXT DEFAULT '',
  paired_key_id TEXT DEFAULT '',
  generated_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indices for faster filtering and retrieval
CREATE INDEX IF NOT EXISTS idx_cryptographic_keys_v2_user_id ON cryptographic_keys_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_cryptographic_keys_v2_created_at ON cryptographic_keys_v2(created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE cryptographic_keys_v2 ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Allow users to view their own keys v2" ON cryptographic_keys_v2;
DROP POLICY IF EXISTS "Allow users to insert their own keys v2" ON cryptographic_keys_v2;
DROP POLICY IF EXISTS "Allow users to update their own keys v2" ON cryptographic_keys_v2;
DROP POLICY IF EXISTS "Allow users to delete their own keys v2" ON cryptographic_keys_v2;

-- 5. Create permissive RLS policies for anon key access (client-side demo)
CREATE POLICY "anon_select_keys_v2"
  ON cryptographic_keys_v2 FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_keys_v2"
  ON cryptographic_keys_v2 FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_keys_v2"
  ON cryptographic_keys_v2 FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_delete_keys_v2"
  ON cryptographic_keys_v2 FOR DELETE TO anon USING (true);

-- For authenticated Clerk users, allow all operations
CREATE POLICY "auth_select_keys_v2"
  ON cryptographic_keys_v2 FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_keys_v2"
  ON cryptographic_keys_v2 FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_keys_v2"
  ON cryptographic_keys_v2 FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_delete_keys_v2"
  ON cryptographic_keys_v2 FOR DELETE TO authenticated USING (true);

-- 6. Verify the table was created
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'cryptographic_keys_v2'
ORDER BY ordinal_position;
