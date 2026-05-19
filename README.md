# SecureEmail — Military-Grade Email Encryption

A professional email system with end-to-end hybrid encryption using **RSA-2048** + **AES-256-GCM**.

## 🔐 What It Does

SecureEmail protects your sensitive emails completely:
- **RSA-2048-OAEP** key pairs generated locally in your browser
- **AES-256-GCM** encrypts each email with a unique session key
- **Public keys** registered for secure key exchange
- **Encrypted emails** stored server-side (ciphertext only)
- **Private keys** never leave your device
- **Zero-knowledge architecture** — servers can't read your emails

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

- `/app` — Next.js App Router pages
  - `/` — Landing page with feature showcase
  - `/dashboard` — Full email client interface
  - `/sign-in` & `/sign-up` — Authentication pages
- `/components` — Reusable React components
  - `EmailComposer.tsx` — Modal for composing encrypted emails
  - `Inbox.tsx` — Email list view with filtering
  - `EmailViewer.tsx` — Read and decrypt emails
  - `KeyManagement.tsx` — Manage RSA keypairs
  - `EmailEncryptionDemo.tsx` — Interactive encryption workflow
  - `FAQSection.tsx` — Frequently asked questions
  - `BlogSection.tsx` — Blog posts
  - `LandingPage.tsx` — Hero section
- `/lib` — Utility functions
  - `supabase.ts` — Database client
  - `utils.ts` — Helper functions

## 🛡️ Security Architecture

| Layer | Algorithm | Key Size |
|-------|-----------|----------|
| Key Exchange | RSA-OAEP | 2048-bit |
| Bulk Encryption | AES-GCM | 256-bit |
| Authentication | GCM Auth Tag | 128-bit |
| IV | Random | 96-bit |
| Key Storage | Browser IndexedDB | Encrypted |

**Zero-Trust Guarantee:**
- ✅ Private keys never transmitted
- ✅ Ciphertext-only database
- ✅ Browser-side encryption
- ✅ No key escrow
- ✅ Recipient-only decryption

## 📋 Features

- **Email Composition** — Write and encrypt emails locally
- **Inbox Management** — Organize received encrypted emails
- **Email Decryption** — View and decrypt messages locally
- **Key Management** — Generate and manage RSA keypairs
- **Attachment Support** — Encrypt files before transmission
- **Search & Filter** — Find emails by sender, subject
- **Security Dashboard** — Monitor encryption status
- **Responsive Design** — Beautiful UI on all devices

## 🎨 Design System

- **Dark theme** with cyan/blue accents
- **Glassmorphism** UI components
- **Smooth animations** with Framer Motion
- **Professional typography** with Inter + Outfit fonts
- **Accessibility first** with proper contrast and semantics

## 📚 Tech Stack

- **Next.js 16.2.2** — React framework
- **React 19.2.4** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS v4** — Styling
- **Framer Motion** — Animations
- **Clerk** — Authentication
- **Supabase** — Database (optional)
- **lucide-react** — Icons

## 🚀 Build & Deploy

```bash
# Production build
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

---

Built with 🔐 Hybrid RSA-2048 + AES-256-GCM — Zero Trust Email Security

