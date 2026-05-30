# 🛡️ CipherScope — Cryptographic Forensics Lab & SecOps Dashboard

![CipherScope Cryptographic Forensics Lab](/public/cipherscope_banner.png)

Welcome to **CipherScope**, an advanced, military-grade Cryptographic Forensics Lab and Security Operations Dashboard. Designed for cryptographers, security engineers, and forensics analysts, CipherScope combines local browser-side hybrid encryption pipelines with deep AI-assisted cryptographic analysis of files and key vaults.

---

## 🔐 Key Features & Core Modules

### 1. Document Operation Lab (`/analyze`)
A secure playground to upload and examine documents (`.pdf`, `.docx`, `.csv`, `.json`, `.txt`) or draft sensitive plaintext in a premium, glassmorphic editor. 
*   **Tampering Simulators**: Corrupt specific bytes or chunks of ciphertext to test decryption resilience.
*   **Local Caching**: Robust local state caching with automated `localStorage` limits integration. If an analysis exceeds the 5MB browser quota, the system switches to high-performance in-memory caching to prevent page crashes.
*   **Analyze & Save**: Compiles and registers forensic file statistics (size, type, metadata) directly into your secure dashboard.

### 2. Live SecOps Dashboard (`/dashboard`)
Your primary command center for forensic monitoring. Displays live visual statistics, security trend charts, and real-time document analysis reports.
*   **Average Security Score Trends**: High-performance AreaCharts tracing security patterns.
*   **RSA Configuration Strength Radar**: A radar chart mapping the mathematical complexity, bits, and vulnerabilities of keys.
*   **Fail-Safe Sync**: Integrates with Supabase using a silent merge strategy. If Row-Level Security (RLS) policies filter out remote rows, the dashboard falls back to local browser storage, keeping your historical charts populated.

### 3. Hybrid Cryptographic Lab (`/hybrid-lab`)
A functional end-to-end sandbox representing true hybrid key architectures.
*   **Key Selection**: Browse and select active RSA and AES keys generated in your Vault.
*   **Encrypted Package Generator**: Encrypt a document payload using your chosen AES session key, package the AES key using the recipient's RSA Public Key, and download a `.json` transport bundle.
*   **Private-Key Decryption Console**: Upload an encrypted bundle, load the corresponding RSA Private Key, decrypt the session key, and recover the original plaintext.
*   **AI Document & Key Analysis**: An API-driven forensic inspector that evaluates the strength of the chosen key parameters (`RSA Key Size`, `AES Mode`) against the decrypted document content to produce an authentic security score (0-100) and actionable mitigations.

### 4. Key Vault (`/vault`)
Manage your generated cryptographic keypairs. View key bits, registration dates, usage scope (paired document, plaintext snippet context), and export keys safely.

---

## 🛡️ Security Architecture

CipherScope adheres to a strict **Zero-Trust Architecture**:

| Security Layer | Protocol / Algorithm | Key Dimensions | Key Storage |
|:---|:---|:---|:---|
| **Bulk Data Encryption** | AES-GCM (Preferred) / CBC | 128 / 256-bit | Browser Memory / Vault |
| **Key Exchange (Wrap)** | RSA-OAEP / PKCS1-v1_5 | 2048 / 4096-bit | Client-Side Decrypted |
| **Authentication Tag** | GCM Auth Tag | 128-bit | Package Payload |
| **Initialization Vector** | Cryptographically Secure Random | 96-bit / 128-bit | Package Payload |
| **Server Database Sync** | Supabase REST Client | UUID Hashed | Hashed & Authenticated |

---

## 🚀 Getting Started (Step-by-Step)

### 1. Prerequisites
Ensure you have the following installed on your system:
*   [Bun](https://bun.sh/) (Next.js Package Manager & Runtime)
*   [Python 3.10+](https://www.python.org/) (FastAPI Backend)

---

### 2. Frontend Installation & Setup

1.  Clone the repository and navigate to the project directory:
    ```bash
    cd cnt-project
    ```
2.  Install dependencies using Bun:
    ```bash
    bun install
    ```
3.  Configure your environment variables. Create a `.env` file in the root directory and add your credentials:
    ```env
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

---

### 3. Backend Installation & Setup

1.  Navigate into the `backend` folder:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure your backend environment variables (Supabase access + Groq Cloud API credentials for AI analysis):
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_service_role_key
    GROQ_API_KEY=your_groq_api_key
    ```

---

### 4. Running the Development Servers

To start the full pipeline (Next.js client + Uvicorn FastAPI server) concurrently:
```bash
bun run dev
```

*   **Frontend**: Hosted at `http://localhost:3000`
*   **FastAPI Backend**: Hosted at `http://localhost:8000`

---

## 📋 Build & Deployment Commands

```bash
# Run linting check (ESLint + TypeScript Compile)
bun run lint

# Build production Next.js bundle
bun run build

# Start production server locally
bun run start
```

---

## 💡 Troubleshooting & Diagnostics

*   **`QuotaExceededError`**: This occurs if you attempt to save large base64 ciphertext files to `localStorage`. The application has been patched to catch this error automatically. Large payloads will be maintained in the in-memory cache (`OP_CACHE`) instead, keeping the application fast and stable.
*   **Hydration Mismatch Warnings**: If client-side parameters like timestamp strings or dynamic keys trigger mismatch errors on reload, the page uses an SSR mount blocker (`hasMounted` gate) to render elements only when the DOM is stable.
*   **Dashboard Empty State**: If your dashboard says "No analyses yet" even after runs, it means Supabase RLS is blocking the query. The application now uses an advanced merging algorithm that prioritizes keeping your local browser history active.

---

*Built with 🔐 Hybrid RSA + AES Cryptography — Zero Trust Security Forensics.*
