# DecenChat — Trustless. Serverless. Unbreakable.

A decentralized end-to-end encrypted messenger DApp built with **Next.js**, **Web Crypto API**, and **Ethereum**.

## 🔐 What It Does

DecenChat eliminates centralized servers entirely:
- **RSA-OAEP 2048-bit** key pairs generated in your browser
- **AES-256-GCM** encrypts each message with a unique session key
- **Public keys** stored on Ethereum smart contract
- **Encrypted message bundles** stored on-chain as events
- **Private keys** never leave your browser
- **Zero external crypto libraries** — Web Crypto API only

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```

### 3. (Optional) Deploy Smart Contract
```bash
npx hardhat node                                    # Start local node
npx hardhat run scripts/deploy.js --network localhost  # Deploy contract
# Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env
```

## 📁 Project Structure

- `/app` — Next.js App Router pages
  - `/` — Landing page
  - `/app/messenger` — Encrypted messenger
  - `/app/keys` — Key management
  - `/app/explainer` — Interactive 7-step encryption visualizer
  - `/app/tamper` — Live tamper detection demo
  - `/app/audit` — On-chain audit trail
  - `/app/about` — Project information
- `/lib/crypto` — Web Crypto API utilities (RSA, AES, bundle assembly)
- `/lib/ethereum.js` — Ethers.js helpers
- `/lib/constants` — Contract ABI and network config
- `/contracts` — Solidity smart contract

## 🛡️ Security Architecture

| Layer | Algorithm | Key Size |
|-------|-----------|----------|
| Key Exchange | RSA-OAEP | 2048-bit |
| Bulk Encryption | AES-GCM | 256-bit |
| Authentication | GCM Auth Tag | 128-bit |
| IV | Random | 96-bit |
| Key Registry | Ethereum Smart Contract | On-chain |

---
Built with 🔐 Hybrid RSA-OAEP + AES-256-GCM — Zero Trust Architecture
