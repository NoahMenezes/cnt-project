-- ─── Supabase Table Setup for Cryptographic Key Storage ───────────────────────
-- Run these SQL commands in your Supabase SQL editor to create the required table
-- Navigate to: Supabase Dashboard > Your Project > SQL Editor > New Query

-- Create the cryptographic_keys table
CREATE TABLE IF NOT EXISTS cryptographic_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('RSA_PUBLIC', 'RSA_PRIVATE', 'AES_SESSION')),
  key_value TEXT NOT NULL,
  key_size INTEGER NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_cryptographic_keys_user_id ON cryptographic_keys(user_id);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_cryptographic_keys_created_at ON cryptographic_keys(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE cryptographic_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own keys
CREATE POLICY IF NOT EXISTS "Users can view their own keys"
  ON cryptographic_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can only insert their own keys
CREATE POLICY IF NOT EXISTS "Users can insert their own keys"
  ON cryptographic_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can only update their own keys
CREATE POLICY IF NOT EXISTS "Users can update their own keys"
  ON cryptographic_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can only delete their own keys
CREATE POLICY IF NOT EXISTS "Users can delete their own keys"
  ON cryptographic_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: You may also want to update your existing 'reports' table if it doesn't have user_id:
-- ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
