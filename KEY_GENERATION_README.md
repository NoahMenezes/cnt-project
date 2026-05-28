# Cryptographic Key Generation & Storage Setup

## Overview

This implementation adds comprehensive key generation and management to your encryption workspace:

- **RSA Public Key**: Used for encrypting the AES session key
- **RSA Private Key**: Used for decrypting the AES session key (keep secure)
- **AES Session Key**: Used for encrypting/decrypting actual document content

All keys are generated on-demand and stored securely in your Supabase database.

## Setup Instructions

### Step 1: Create Supabase Table

1. Go to your Supabase project: https://app.supabase.com
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `SUPABASE_SETUP.sql`
5. Click **Run** to execute the SQL

This will create:
- `cryptographic_keys` table with proper schema
- Row Level Security (RLS) policies to protect user data
- Indexes for performance

### Step 2: Verify Environment Variables

Make sure your `.env.local` has these Supabase variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Update Authentication

If you haven't authenticated with Supabase yet:
1. The app uses `supabase.auth.getSession()` automatically
2. Keys are stored per authenticated user
3. If no user is authenticated, keys are stored in localStorage as a fallback

## Usage

### Generating Keys (Analyze Page)

1. Navigate to `/analyze`
2. Scroll to the **"Generate & Store Cryptographic Keys"** section
3. Click one of three buttons:
   - **Generate RSA Public Key** - Creates a 2048-bit RSA public key
   - **Generate RSA Private Key** - Creates a 2048-bit RSA private key (KEEP SECURE!)
   - **Generate AES Session Key** - Creates a 256-bit AES session key

4. Each key is automatically:
   - Generated with cryptographic randomness
   - Labeled with the generation date
   - Saved to your Supabase database
   - Added to a success log

### Viewing & Managing Keys (Reports Page)

1. Navigate to `/reports`
2. Scroll to the bottom to see **"Stored Cryptographic Keys"** section
3. Each key shows:
   - Type (RSA Public / RSA Private / AES Session)
   - Size (bits)
   - Generation date
   - Description

4. For each key, you can:
   - **Copy** - Copy the key value to clipboard
   - **Delete** - Remove the key from database

### Encryption/Decryption Workflow

1. **Generate Keys**: Use the three buttons to create your keys
2. **Enter Plaintext**: Type or upload your document in the Plaintext Editor
3. **Encrypt**: Click "Run Hybrid Encryption" button
   - RSA encrypts the AES session key
   - AES encrypts your plaintext
   - Results appear in the Ciphertext Workspace
4. **Decrypt**: Click "Decrypt Payload" button
   - RSA decrypts the session key
   - AES decrypts the ciphertext
   - Results appear in the Restored Payload section

## Database Schema

### cryptographic_keys Table

```sql
{
  id: string                    -- UUID primary key
  user_id: string              -- Foreign key to auth.users
  key_type: string             -- 'RSA_PUBLIC' | 'RSA_PRIVATE' | 'AES_SESSION'
  key_value: string            -- The actual key (PEM format for RSA, hex for AES)
  key_size: number             -- Key size in bits (2048 for RSA, 256 for AES)
  label: string                -- Human-readable label
  description: string          -- Additional details
  generated_at: timestamp      -- When the key was generated
  created_at: timestamp        -- When the record was created
  updated_at: timestamp        -- When the record was last updated
}
```

## Security Considerations

### RSA Private Key
- **NEVER** share your private key
- It's needed to decrypt session keys
- If compromised, regenerate and re-encrypt all data

### AES Session Keys
- Should be unique per encryption
- Currently stored in database (consider adding encryption at rest)
- Used to encrypt/decrypt document content

### Best Practices
1. Regularly audit your stored keys
2. Delete keys you no longer need
3. Use HTTPS for all communication
4. Enable Supabase RLS (enabled by default in this setup)
5. Consider adding key rotation policies

## Troubleshooting

### Keys Not Saving?
- Check if you're authenticated with Supabase
- Verify environment variables are set
- Check browser console for errors
- Ensure the `cryptographic_keys` table exists

### Keys Not Appearing in Reports?
- Refresh the page (Cmd+R or Ctrl+R)
- Check that `cipher_scope_db_update` event is firing
- Verify RLS policies are correct

### Encryption/Decryption Failing?
- Ensure RSA keys match (use the same pair)
- AES session key must be generated before encryption
- Check for console errors in browser dev tools

## Next Steps

1. ✅ Keys are generated and stored
2. ✅ Encryption/decryption works with these keys
3. Consider: Download encrypted documents for backup
4. Consider: Implement key rotation schedule
5. Consider: Add encryption in transit and at rest

## File Changes Summary

### Modified Files:
- `lib/store.ts` - Added key management functions (getKeys, saveKey, deleteKey)
- `app/analyze/page.tsx` - Added key generation section and buttons
- `app/reports/page.tsx` - Added keys display and management UI

### New Files:
- `SUPABASE_SETUP.sql` - SQL migrations for Supabase
- `KEY_GENERATION_README.md` - This file

### Database:
- New table: `cryptographic_keys`
- New RLS policies for security
