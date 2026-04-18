# SecureShare – End-to-End Encrypted sharing platform

A full-stack, production-ready Next.js application for securely sharing files and messages using **Hybrid Encryption (RSA + AES)**.

## 🔐 Security Architecture

- **Hybrid Encryption**: AES-GCM 256-bit for data encryption, RSA-OAEP for AES key encryption.
- **Client-Side Crypto**: All encryption and decryption happen in the user's browser using the native Web Crypto API.
- **Zero-Knowledge**: The backend (Prisma + SQLite) only stores encrypted blobs and public RSA keys. Plaintext never leaves your machine.
- **Password-Based Key Derivation**: Private keys are stored in `localStorage`, but they are further encrypted using **PBKDF2** with a user-provided master password.

## 🚀 Getting Started

### 1. Environment Setup
Add your Clerk API keys to `.env`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
DATABASE_URL="file:./dev.db"
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Initialize Database
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

## 🛠️ Features

- ✅ **RSA Key Management**: Generate, export, and delete cryptographic keys.
- ✅ **Secure File Upload**: Drag and drop files, encrypt locally, and submit to the vault.
- ✅ **Secure Messaging**: Peer-to-peer encrypted chat with bubble decryption.
- ✅ **Premium UI**: Modern dark theme with glassmorphism and Framer Motion animations.
- ✅ **QR Code Integration**: Share public keys via QR code for easy importing.

## 📁 Project Structure

- `/app`: Next.js App Router routes and API endpoints.
- `/lib/crypto`: Core Web Crypto API logic (RSA-OAEP, AES-GCM, PBKDF2).
- `/lib/db`: Prisma client singleton.
- `/hooks`: Custom React hooks for cryptographic state management.
- `/components`: Shared UI components.

## 🔒 Limitations (Demo Only)
- For this demo, encrypted file blobs are stored as base64 in the SQLite database. In a production environment, you should upload the encrypted blob to S3/equivalent.
- Maximum file size currently limited by browser memory (~50MB).

---
Built with 🔐 Hybrid Encryption.
