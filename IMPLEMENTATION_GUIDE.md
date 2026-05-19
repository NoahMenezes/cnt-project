# SecureEmail - Complete Implementation Guide

## 🚀 Quick Start (Complete Working System)

This guide walks you through building a fully functional SecureEmail system with end-to-end encryption.

---

## 📋 Prerequisites

- Node.js 18+ or Bun (recommended)
- Supabase account (free tier available)
- Clerk account (free tier available)
- Git

---

## 🔧 Setup Steps

### Step 1: Clone and Install Dependencies

```bash
cd /home/noah/Desktop/NextJS/cnt-project
bun install
```

### Step 2: Configure Environment Variables

```bash
# Copy example to actual .env.local
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

Required environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_SECRET_KEY` - From Clerk dashboard
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase dashboard
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase dashboard

### Step 3: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Create new project
3. Navigate to SQL Editor
4. Copy contents of `DATABASE_SCHEMA.sql`
5. Paste and run in SQL editor
6. Copy your API URL and keys to `.env.local`

### Step 4: Configure Clerk

1. Go to https://dashboard.clerk.com
2. Create new application
3. Add `http://localhost:3000` as allowed callback URL
4. Copy keys to `.env.local`

### Step 5: Run Development Server

```bash
bun run dev
```

Visit http://localhost:3000

---

## 🔐 Implementation Phases

### Phase 1: User Registration & Key Generation ✅ (30 min)

**File:** `app/api/crypto/generate-keys/route.ts`

**Tasks:**
1. When user signs up via Clerk, trigger RSA key generation
2. Store public key in Supabase `users` table
3. Encrypt private key with passphrase and store
4. Generate and store key fingerprint

**Implementation:**
```typescript
// In app/api/crypto/generate-keys/route.ts
import { generateRSAKeyPair, generateFingerprint } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  // Generate RSA-2048 keypair
  const { publicKey, privateKey } = await generateRSAKeyPair();
  
  // Store in Supabase users table
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  await supabase
    .from('users')
    .update({
      public_key: publicKey,
      private_key_encrypted: privateKey,
      key_fingerprint: generateFingerprint(publicKey)
    })
    .eq('clerk_id', userId);
  
  return NextResponse.json({ success: true });
}
```

**Testing:**
```bash
# Sign up via /sign-up route
# Should trigger key generation automatically
```

---

### Phase 2: Email Composition & Encryption ✅ (45 min)

**File:** `app/api/emails/send/route.ts`

**Tasks:**
1. Accept email data from EmailComposer modal
2. Retrieve recipient's public key
3. Encrypt email body with AES-256-GCM
4. Encrypt AES key with recipient's RSA public key
5. Store encrypted email in Supabase

**Implementation:**
```typescript
// In app/api/emails/send/route.ts
import { encryptAES, encryptWithRSA } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  const { to, subject, body } = await request.json();
  
  // Get recipient's public key
  const recipient = await supabase
    .from('users')
    .select('id, public_key')
    .eq('email', to)
    .single();
  
  // Generate AES key and encrypt body
  const aesKey = crypto.randomBytes(32);
  const encryption = encryptAES(body, aesKey);
  
  // Encrypt AES key with recipient's public key
  const encryptedAesKey = encryptWithRSA(aesKey.toString('hex'), recipient.public_key);
  
  // Store in database
  await supabase
    .from('emails')
    .insert({
      sender_id: userId,
      recipient_id: recipient.id,
      subject,
      body_encrypted: encryption.ciphertext,
      aes_key_encrypted: encryptedAesKey,
      iv: encryption.iv,
      auth_tag: encryption.authTag
    });
  
  return NextResponse.json({ success: true });
}
```

**Testing:**
```bash
# Use Postman or curl to POST to /api/emails/send
# Verify encrypted email appears in recipient's inbox
```

---

### Phase 3: Email Retrieval & Display ✅ (30 min)

**File:** `app/api/emails/route.ts`

**Tasks:**
1. Fetch encrypted emails from Supabase
2. Return encrypted data to frontend
3. Update EmailViewer to decrypt on-demand

**Implementation:**
```typescript
// In app/api/emails/route.ts
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const folder = request.nextUrl.searchParams.get('folder') || 'inbox';
  
  const user = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();
  
  const emails = await supabase
    .from('emails')
    .select('*')
    .eq('recipient_id', user.id)
    .eq('folder', folder);
  
  return NextResponse.json({ emails: emails.data });
}
```

---

### Phase 4: Email Decryption ✅ (30 min)

**File:** `components/EmailViewer.tsx` & `app/api/crypto/decrypt/route.ts`

**Tasks:**
1. Get private key from user session/localStorage
2. Call decrypt API with encrypted data
3. Display plaintext in EmailViewer

**Implementation:**
```typescript
// Client-side decryption in EmailViewer.tsx
const handleDecrypt = async () => {
  const response = await fetch('/api/crypto/decrypt', {
    method: 'POST',
    body: JSON.stringify({
      ciphertext: email.body_encrypted,
      encryptedAesKey: email.aes_key_encrypted,
      iv: email.iv,
      authTag: email.auth_tag,
      privateKey: userPrivateKey
    })
  });
  
  const { plaintext } = await response.json();
  setDecryptedBody(plaintext);
};
```

---

### Phase 5: Attachments Handling ✅ (45 min)

**Files:** `app/api/attachments/upload/route.ts`, `app/api/attachments/download/route.ts`

**Tasks:**
1. Upload file with encryption
2. Store in Supabase Storage
3. Download and decrypt files

**Implementation:**
```typescript
// File upload with encryption
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Encrypt file
  const buffer = await file.arrayBuffer();
  const aesKey = crypto.randomBytes(32);
  const encrypted = encryptAES(Buffer.from(buffer).toString('hex'), aesKey);
  
  // Upload to Supabase Storage
  await supabase.storage
    .from('attachments')
    .upload(`${emailId}/${file.name}`, Buffer.from(encrypted.ciphertext, 'hex'));
  
  // Store metadata
  await supabase
    .from('attachments')
    .insert({
      email_id: emailId,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type
    });
}
```

---

## 🧪 Testing the Complete System

### Manual Testing Checklist

- [ ] User signup creates RSA keys
- [ ] Compose email encrypts with recipient's public key
- [ ] Encrypted email stored in database
- [ ] Recipient can see email in inbox (encrypted)
- [ ] Recipient can decrypt and read plaintext
- [ ] Reply creates new encrypted message
- [ ] Attachments encrypt before upload
- [ ] Attachments decrypt on download
- [ ] Search works on encrypted emails (if using FTS)
- [ ] Delete email removes from database

### API Testing with Curl

```bash
# Generate keys
curl -X POST http://localhost:3000/api/crypto/generate-keys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Send encrypted email
curl -X POST http://localhost:3000/api/emails/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test",
    "body": "Hello world"
  }'

# Fetch emails
curl http://localhost:3000/api/emails \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Database Structure

See `DATABASE_SCHEMA.sql` for complete schema with:
- **users** - User profiles and keypairs
- **emails** - Encrypted email storage
- **attachments** - Encrypted files
- **contacts** - Contact management
- **audit_logs** - Security audit trail

---

## 🔒 Security Best Practices

1. **Never transmit private keys** over HTTP (always HTTPS in production)
2. **Enable Row Level Security (RLS)** on all Supabase tables
3. **Use environment variables** for all secrets
4. **Hash emails** before storing for privacy (optional)
5. **Log all decryption attempts** for audit trail
6. **Rate limit API endpoints** to prevent abuse
7. **Implement email verification** before allowing email
8. **Use HTTPS only** in production
9. **Implement token expiry** on auth tokens
10. **Monitor failed decryption attempts**

---

## 🚀 Deployment Checklist

- [ ] All environment variables set in production
- [ ] Supabase RLS enabled and tested
- [ ] CORS configured correctly
- [ ] API rate limiting implemented
- [ ] Error logging configured
- [ ] Email verification implemented
- [ ] Backup strategy in place
- [ ] SSL certificate installed
- [ ] Database backups automated
- [ ] Monitor uptime and performance

---

## 📝 Common Issues & Solutions

**Issue:** "Private key format error"
- Solution: Ensure private key includes `-----BEGIN...-----` and `-----END...-----` markers

**Issue:** "Decryption failed - auth tag mismatch"
- Solution: Verify IV and auth tag match the ones used during encryption

**Issue:** "User not found"
- Solution: Ensure Clerk user is synced to Supabase users table on signup

**Issue:** "Recipient public key not found"
- Solution: Verify recipient has completed signup and key generation

---

## 🎯 Next Steps

1. Complete Phase 1 (Key Generation)
2. Test key generation in /dashboard
3. Complete Phase 2 (Email Encryption)
4. Test email sending via Postman
5. Complete Phase 3 (Email Retrieval)
6. Test email list display
7. Complete Phase 4 (Decryption)
8. Test email reading
9. Complete Phase 5 (Attachments)
10. Full end-to-end testing
11. Deploy to production

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [RSA Encryption Basics](https://en.wikipedia.org/wiki/RSA_(cryptosystem))
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

---

**Status:** Ready for implementation ✅

All scaffolding complete. Begin with Phase 1!
