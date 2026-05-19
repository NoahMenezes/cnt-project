# SecureEmail - Complete Working System Guide

## 🎯 Working Features (Current - UI Complete)

### ✅ Frontend Features (100% Complete)
- Landing page with marketing content
- Email composer modal with attachment support
- Inbox with email list and filtering
- Email viewer with decryption UI
- Key management panel
- Dashboard navigation
- Clerk authentication integration
- Responsive dark-themed UI with animations

### ⚠️ Features Requiring Backend Implementation

## 🔌 Required APIs & Endpoints

### 1. **Email Management API**
```
POST /api/emails/send
- Input: { to, subject, body, attachments, encryptedKeyBundle }
- Output: { emailId, timestamp, status }

GET /api/emails
- Query: { folder: 'inbox' | 'sent', skip: 0, limit: 20, search: string }
- Output: { emails: EmailItem[], total }

GET /api/emails/:emailId
- Output: { email with encrypted content }

DELETE /api/emails/:emailId
- Output: { success }

PUT /api/emails/:emailId/flag
- Input: { isRead, starred, spam }
- Output: { success }
```

### 2. **Encryption/Decryption API**
```
POST /api/crypto/generate-keys
- Input: { userId }
- Output: { publicKey, privateKeyEncrypted, keyId }

POST /api/crypto/encrypt
- Input: { plaintext, recipientPublicKey }
- Output: { ciphertext, aesKey, iv }

POST /api/crypto/decrypt
- Input: { ciphertext, privateKeyEncrypted, encryptedAesKey }
- Output: { plaintext }

GET /api/crypto/public-key/:userId
- Output: { publicKey, fingerprint, keyId }
```

### 3. **User Management API**
```
POST /api/users/register
- Input: { email, name, clerkId }
- Output: { userId, publicKey }

GET /api/users/profile
- Output: { userId, email, name, publicKey, keyId }

PUT /api/users/profile
- Input: { name, publicKey }
- Output: { success }
```

### 4. **Attachment API**
```
POST /api/attachments/upload
- Input: FormData with file, encryptedFile
- Output: { attachmentId, filename, size }

GET /api/attachments/:attachmentId
- Output: Binary encrypted file

DELETE /api/attachments/:attachmentId
- Output: { success }
```

## 🗄️ Database Schema (Supabase)

### Table: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT,
  key_fingerprint TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: emails
```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  body_encrypted TEXT NOT NULL,
  aes_key_encrypted TEXT NOT NULL,
  iv TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: attachments
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY,
  email_id UUID REFERENCES emails(id),
  filename TEXT NOT NULL,
  file_data BYTEA,
  file_size INT,
  mime_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: contacts
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  contact_email TEXT,
  contact_name TEXT,
  contact_public_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Encryption Architecture

### Hybrid Encryption Flow
```
1. PLAINTEXT EMAIL
   ↓
2. Generate Random 256-bit AES Key + 96-bit IV
   ↓
3. Encrypt Email Body with AES-256-GCM
   ↓
4. Encrypt AES Key with Recipient's RSA-2048 Public Key
   ↓
5. Create Bundle: { iv, ciphertext, encryptedAesKey, fingerprint }
   ↓
6. Send to Backend → Store in Database
   ↓
7. Recipient Downloads Encrypted Email
   ↓
8. Decrypt RSA-2048 Key Bundle → Get AES Key
   ↓
9. Decrypt AES-256-GCM with AES Key + IV
   ↓
10. PLAINTEXT VISIBLE TO USER
```

## 💻 Implementation Stack (All Free)

### Backend Options
**Option A: Vercel Edge Functions + Supabase** (Recommended)
- Next.js API Routes (included with Next.js)
- Supabase (free tier: 2GB database, 1GB file storage)
- @supabase/supabase-js client library
- node-rsa or crypto module for encryption

**Option B: Supabase Edge Functions**
- Write functions in TypeScript/Deno
- Deploy directly to Supabase
- No server management needed
- Free tier: Up to 1M invocations/month

**Option C: Self-Hosted** (Free but requires server)
- Node.js/Express backend
- PostgreSQL (free self-hosted)
- Deploy to Railway, Render, or own VPS

### Encryption Libraries (Free & Open Source)
```
crypto (Node.js built-in) - No additional dependency
- RSA-2048-OAEP
- AES-256-GCM
- SHA-256

OR

tweetnacl.js - Pure JavaScript, no dependencies
- Nacl.Box (equivalent of RSA)
- Nacl.SecretBox (equivalent of AES)
```

### Database (Free Tier)
- **Supabase**: 2GB database, 1GB file storage, 7 days log history
- **PostgreSQL**: Self-hosted on own server (completely free)

### File Storage (Free)
- **Supabase Storage**: 1GB included, $5/month for additional
- **AWS S3**: 5GB first year free, then pay-as-you-go
- **Cloudflare R2**: First 10GB free per month

## 🚀 Implementation Roadmap

### Phase 1: Backend Setup (1-2 hours)
1. Create Next.js API routes in `/app/api`
2. Set up Supabase project
3. Create database tables
4. Set up environment variables

### Phase 2: User & Auth (1 hour)
1. Link Clerk userId to database
2. Generate RSA keys on signup
3. Store public key in database
4. Retrieve keys in dashboard

### Phase 3: Email Encryption (2-3 hours)
1. Implement hybrid encryption in utility functions
2. Create `/api/emails/send` endpoint
3. Encrypt email body before sending
4. Store ciphertext in database

### Phase 4: Email Retrieval & Decryption (2-3 hours)
1. Create `/api/emails` endpoint
2. Fetch encrypted emails from database
3. Client-side decryption in EmailViewer
4. Display plaintext after decryption

### Phase 5: Attachments (2 hours)
1. Create `/api/attachments/upload`
2. Encrypt file before storing
3. Create `/api/attachments/download`
4. Decrypt on download

### Phase 6: Contacts & Address Book (1 hour)
1. Add contacts table
2. Create contact management UI
3. Auto-populate recipient suggestions

### Phase 7: Search & Filtering (1 hour)
1. Implement full-text search in database
2. Filter by sender, date, encrypted status
3. Update inbox component

## 📝 Sample API Route Implementation

### `/app/api/emails/send/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, subject, body, encryptedAesKey, iv, ciphertext } = await request.json();

    // Get recipient's user ID from email
    const { data: recipient } = await supabase
      .from('users')
      .select('id')
      .eq('email', to)
      .single();

    if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });

    // Store encrypted email in database
    const { data: email } = await supabase
      .from('emails')
      .insert({
        sender_id: userId,
        recipient_id: recipient.id,
        subject,
        body_encrypted: ciphertext,
        aes_key_encrypted: encryptedAesKey,
        iv,
        is_read: false
      })
      .select()
      .single();

    return NextResponse.json({ 
      emailId: email.id, 
      status: 'sent', 
      timestamp: new Date() 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Send failed' }, { status: 500 });
  }
}
```

### `/app/api/crypto/decrypt/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { privateDecrypt } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { encryptedAesKey, ciphertext, iv, privateKey, authTag } = await request.json();

    // Decrypt AES key with RSA private key
    const aesKey = privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
      },
      Buffer.from(encryptedAesKey, 'hex')
    );

    // Decrypt ciphertext with AES key
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      aesKey,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return NextResponse.json({ plaintext });
  } catch (error) {
    return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
  }
}
```

## 🔑 Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=xxxxx
CLERK_SECRET_KEY=xxxxx

# Encryption (if needed)
ENCRYPTION_PRIVATE_KEY=xxxxx
```

## ✅ Verification Checklist

- [ ] Supabase project created and configured
- [ ] Database tables created with correct schema
- [ ] Clerk authentication connected to users table
- [ ] API routes created and tested with Postman
- [ ] RSA key generation implemented
- [ ] Email encryption working end-to-end
- [ ] Email storage and retrieval working
- [ ] Decryption working in frontend
- [ ] Attachments upload/download working
- [ ] Search and filtering working

## 🧪 Testing Commands

```bash
# Create user account via Clerk signup
# Should auto-trigger RSA key generation

# Send encrypted email via dashboard
# Should appear in recipient's inbox encrypted

# Open encrypted email
# Should decrypt on-the-fly and display plaintext

# Reply to email
# Should create new encrypted message
```

## 💡 Tips

1. **Use Postman** to test API endpoints before integrating with frontend
2. **Enable Row Level Security (RLS)** on Supabase tables for security
3. **Hash email bodies** before storing for privacy
4. **Use HTTPS only** in production
5. **Never store private keys** unencrypted
6. **Implement email verification** for security
7. **Rate limit** API endpoints to prevent abuse
8. **Log decryption attempts** for audit trail

---

**Next Step:** Begin Phase 1 implementation with API routes setup.
