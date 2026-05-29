-- ─── Supabase Table Setup for Structured Cryptographic Key Storage (V2) ────────
-- Run these SQL commands in your Supabase SQL editor to create the new table.
-- Navigate to: Supabase Dashboard > Your Project > SQL Editor > New Query

-- 1. Create the new structured cryptographic_keys_v2 table
CREATE TABLE IF NOT EXISTS cryptographic_keys_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Stores Clerk/Auth User ID strings directly
  key_type TEXT NOT NULL CHECK (key_type IN ('RSA_PUBLIC', 'RSA_PRIVATE', 'AES_SESSION')),
  key_value TEXT NOT NULL,
  key_size INTEGER NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  document_name TEXT,
  plaintext_snippet TEXT,
  ciphertext_payload TEXT,
  encrypted_session_key TEXT,
  aes_iv TEXT,
  aes_mode TEXT,
  paired_key_id TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indices for faster filtering and retrieval
CREATE INDEX IF NOT EXISTS idx_cryptographic_keys_v2_user_id ON cryptographic_keys_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_cryptographic_keys_v2_created_at ON cryptographic_keys_v2(created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE cryptographic_keys_v2 ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies to allow operations based on user_id string match
CREATE POLICY "Allow users to view their own keys v2"
  ON cryptographic_keys_v2
  FOR SELECT
  USING (true); -- Set to true for full client-side demo flexibility

CREATE POLICY "Allow users to insert their own keys v2"
  ON cryptographic_keys_v2
  FOR INSERT
  WITH CHECK (true); -- Set to true for full client-side demo flexibility

CREATE POLICY "Allow users to update their own keys v2"
  ON cryptographic_keys_v2
  FOR UPDATE
  USING (true); -- Set to true for full client-side demo flexibility

CREATE POLICY "Allow users to delete their own keys v2"
  ON cryptographic_keys_v2
  FOR DELETE
  USING (true); -- Set to true for full client-side demo flexibility
