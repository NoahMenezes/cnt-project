# SecureShare – Client-Side Encrypted Platform

A frontend-only Next.js application for securely managing files and messages using **Hybrid Encryption (RSA + AES)**.

## 🔐 Security Architecture

- **Hybrid Encryption**: AES-GCM 256-bit for data encryption, RSA-OAEP for AES key encryption.
- **Client-Side Crypto**: All encryption and decryption happen in the user's browser using the native Web Crypto API.
- **Local Key Storage**: Private keys are stored in `localStorage`, encrypted using **PBKDF2** with a user-provided master password.
- **Pure Frontend**: This version of the project contains zero backend code. Encryption workflows are simulated for demonstration.

## 🚀 Getting Started

### 1. Environment Setup
Add your Clerk API keys to `.env`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Development Server
```bash
pnpm dev
```

## 🛠️ Features

- ✅ **RSA Key Management**: Generate, export, and delete cryptographic keys locally.
- ✅ **Secure UI**: Modern dark theme with glassmorphism and Framer Motion animations.
- ✅ **QR Code Integration**: Share public keys via QR code for easy importing.
- ✅ **Encryption Simulation**: Test the RSA+AES workflow without a backend.

## 📁 Project Structure

- `/app`: Next.js App Router routes and frontend pages.
- `/lib/crypto`: Core Web Crypto API logic (RSA-OAEP, AES-GCM, PBKDF2).
- `/hooks`: Custom React hooks for cryptographic state management.

---
Built with 🔐 Hybrid Encryption.
