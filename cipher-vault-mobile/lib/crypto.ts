/**
 * CipherVault Mobile — Hybrid RSA-AES Decryption
 * Mirrors web app's crypto.ts for cross-platform consistency.
 */

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = BigInt(1);
  base = base % mod;
  while (exp > BigInt(0)) {
    if (exp % BigInt(2) === BigInt(1)) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = exp / BigInt(2);
  }
  return res;
}

function rsaDecryptString(cipherText: string, d: bigint, n: bigint): string {
  const chunks = cipherText.split("-");
  let out = "";
  for (const chunk of chunks) {
    if (!chunk) continue;
    try {
      out += String.fromCharCode(Number(modPow(BigInt(chunk), d, n)));
    } catch {
      out += "\uFFFD";
    }
  }
  return out;
}

function parsePEMParams(pem: string): Record<string, string> | null {
  try {
    const lines = pem
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("---"));
    for (const line of lines) {
      try {
        const decoded = atob(
          line
            .replace(/[^A-Za-z0-9+/=]/g, "")
            .padEnd(Math.ceil(line.length / 4) * 4, "=")
        );
        if (decoded.startsWith("{")) {
          const obj = JSON.parse(decoded);
          if (typeof obj === "object") return obj as Record<string, string>;
        }
      } catch {
        /* try next */
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function extractRSAPrivateNumbers(
  pem: string
): { d: bigint; n: bigint } | null {
  try {
    const params = parsePEMParams(pem);
    if (!params) return null;
    const n = BigInt(params.n ?? "0");
    const d = BigInt(params.d ?? "0");
    if (n <= BigInt(0) || d <= BigInt(0)) return null;
    return { d, n };
  } catch {
    return null;
  }
}

export function aesDecryptSim(ciphertext: string, keyHex?: string): string {
  try {
    const cleaned = ciphertext.trim().replace(/\s+/g, "");
    const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
    const decoded = decodeURIComponent(atob(padded));
    const parts = decoded.split("||SALT||");
    if (parts.length > 1) {
      if (keyHex) {
        const expectedSalt = keyHex.substring(0, 6);
        if (parts[1] !== expectedSalt) {
          throw new Error("Key mismatch: The session key does not match.");
        }
      }
      return parts[0];
    }
    return decoded;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Key mismatch")) throw e;
    return "";
  }
}

function isRsaWrappedCiphertext(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.includes("-")) return false;
  const chunks = trimmed.split("-");
  return chunks.length > 1 && chunks.every((c) => /^\d+$/.test(c.trim()));
}

export function hybridDecrypt(
  ciphertext: string,
  encryptedSessionKey: string,
  privateKeyPem: string
): { success: boolean; plaintext: string; error?: string } {
  try {
    const parsed = extractRSAPrivateNumbers(privateKeyPem.trim());
    if (!parsed) {
      return {
        success: false,
        plaintext: "",
        error: "Could not read the RSA Private Key. Make sure you copied it completely.",
      };
    }
    const { d, n } = parsed;
    const cleanText = (text: string) =>
      text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");

    if (encryptedSessionKey && ciphertext) {
      const aesKeyHex = rsaDecryptString(encryptedSessionKey, d, n);
      let aesCiphertext = ciphertext;
      if (isRsaWrappedCiphertext(ciphertext)) {
        aesCiphertext = rsaDecryptString(ciphertext, d, n);
      }
      const plaintext = aesDecryptSim(aesCiphertext, aesKeyHex);
      if (plaintext) return { success: true, plaintext: cleanText(plaintext) };
    }

    if (!encryptedSessionKey && ciphertext) {
      const plaintext = aesDecryptSim(ciphertext);
      if (plaintext) return { success: true, plaintext: cleanText(plaintext) };
    }

    if (isRsaWrappedCiphertext(ciphertext)) {
      const inner = rsaDecryptString(ciphertext, d, n);
      const tryAes = aesDecryptSim(inner);
      const plaintext = tryAes || inner;
      if (plaintext.trim()) return { success: true, plaintext: cleanText(plaintext) };
    }

    return {
      success: false,
      plaintext: "",
      error: "Decryption returned empty. The private key may not match.",
    };
  } catch (err) {
    return {
      success: false,
      plaintext: "",
      error: err instanceof Error ? err.message : "Unknown decryption error.",
    };
  }
}

export function aesEncryptSim(text: string, keyHex: string): { ciphertext: string; iv: string } {
  const iv = Array.from({ length: 12 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
  const salt = keyHex.substring(0, 6);
  const enc = btoa(encodeURIComponent(text + "||SALT||" + salt));
  return { ciphertext: enc, iv };
}

export function generateAESKeyHex(bits: number): string {
  return Array.from({ length: bits / 8 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
  ).join("");
}

