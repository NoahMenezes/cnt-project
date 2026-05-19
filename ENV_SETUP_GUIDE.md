# 🔑 Environment Variables Setup Guide

## Step 1: Clerk Authentication (✅ Already Configured)

Your Clerk keys are already in `.env`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_a25vd2luZy1rb2ktMy5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_zKhkdwexvSIj8Pj4WFoq0Z0AgAIvytMhaFwKAy9tvA
```

✅ **No action needed** - Already working!

---

## Step 2: Supabase Setup (⏳ Optional - For Production)

### Get Your Keys:

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Click "Start Your Project"
   - Sign up with GitHub or email
   - Create organization & project

2. **Find Your Keys**
   - Click your project name
   - Go to **Settings** → **API**
   - Copy these values:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

3. **Run Database Schema**
   - In Supabase, go to **SQL Editor**
   - Click **New Query**
   - Copy contents of `DATABASE_SCHEMA.sql`
   - Paste into SQL editor
   - Click **Run**

4. **Add to `.env`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

---

## Step 3: Encryption Configuration (✅ Already Set)

```env
ENCRYPTION_PASSPHRASE=default-passphrase
```

This is already in your `.env` with a default value. For production, change this to something secure:
```env
ENCRYPTION_PASSPHRASE=your-very-secure-random-passphrase-here
```

---

## Step 4: Optional - Email Notifications (SendGrid)

Only needed if you want email notifications. For now, you can skip this.

To set up later:
1. Go to https://sendgrid.com
2. Sign up and create API key
3. Add to `.env`:
   ```env
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

---

## Current Status

| Service | Status | Keys in .env |
|---------|--------|-------------|
| Clerk Auth | ✅ Ready | Yes |
| Supabase | ⏳ Optional | Placeholder |
| Encryption | ✅ Ready | Yes |
| SendGrid | ❌ Optional | Not needed |

---

## What to Do Now

### Option 1: Run as-is (No Database)
```bash
bun run dev
```
✅ Works immediately with mock data

### Option 2: Add Supabase (30 min)
1. Create Supabase account
2. Get credentials
3. Add to `.env`
4. Run `DATABASE_SCHEMA.sql`
5. Update API routes to use Supabase
6. Restart dev server

### Option 3: Deploy Today (2 hours)
1. Complete Option 2
2. Commit to GitHub
3. Deploy to Vercel/Railway
4. Set environment variables in hosting dashboard
5. Done!

---

## File Locations

- **Current config:** `.env`
- **Template:** `.env.example`
- **Database schema:** `DATABASE_SCHEMA.sql`
- **This guide:** `ENV_SETUP_GUIDE.md`

---

## ✅ Summary

Your system is **ready to use right now**. The Clerk authentication is already configured and working. You can optionally add Supabase later when you're ready for persistent storage.

**Next steps:**
1. Run `bun run dev`
2. Visit http://localhost:3000
3. Test the system
4. Add Supabase when needed

