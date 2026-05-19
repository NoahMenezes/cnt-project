/**
 * Database Schema for SecureEmail
 * These tables should be created in Supabase PostgreSQL database
 */

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT,
  key_fingerprint TEXT NOT NULL,
  key_created_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Emails table
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body_encrypted TEXT NOT NULL,
  aes_key_encrypted TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_spam BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  folder TEXT DEFAULT 'inbox', -- inbox, sent, draft, trash
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_encrypted BYTEA NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  contact_public_key TEXT,
  last_contacted TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, contact_email)
);

-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'email_sent', 'email_decrypted', 'key_regenerated'
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Row Level Security Policies (Enable RLS first)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY users_own_profile ON users
  FOR SELECT USING (clerk_id = current_user_id());

-- Users can only see emails sent to or from them
CREATE POLICY emails_own_emails ON emails
  FOR SELECT USING (
    sender_id = (SELECT id FROM users WHERE clerk_id = current_user_id())
    OR
    recipient_id = (SELECT id FROM users WHERE clerk_id = current_user_id())
  );

-- Indexes for performance
CREATE INDEX idx_emails_sender ON emails(sender_id);
CREATE INDEX idx_emails_recipient ON emails(recipient_id);
CREATE INDEX idx_emails_folder ON emails(folder);
CREATE INDEX idx_attachments_email ON attachments(email_id);
CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
