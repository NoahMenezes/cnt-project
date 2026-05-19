import crypto from "crypto";

interface EncryptionResult {
  ciphertext: string;
  encryptedAesKey: string;
  iv: string;
  authTag: string;
}

interface DecryptionResult {
  plaintext: string;
}

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Generate RSA-2048 keypair
 */
export async function generateRSAKeyPair(): Promise<KeyPair> {
  return new Promise((resolve, reject) => {
    const passphrase = process.env.ENCRYPTION_PASSPHRASE || "default-passphrase";
    
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
          cipher: "aes-256-cbc",
          passphrase: passphrase,
        },
      },
      (err, publicKey, privateKey) => {
        if (err) {
          console.error("Key generation error:", err);
          reject(err);
        } else {
          resolve({ 
            publicKey: publicKey.toString(), 
            privateKey: privateKey.toString() 
          });
        }
      }
    );
  });
}

/**
 * Encrypt plaintext with AES-256-GCM
 */
export function encryptAES(plaintext: string, key: Buffer): EncryptionResult {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext,
    encryptedAesKey: "",
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypt AES-256-GCM encrypted text
 * TODO: Complete implementation
 */
export function decryptAES(
  ciphertext: string,
  key: Buffer,
  iv: Buffer,
  authTag: Buffer
): DecryptionResult {
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");

    return { plaintext };
  } catch (error) {
    console.error("AES decryption error:", error);
    throw error;
  }
}

/**
 * Encrypt AES key with RSA public key
 */
export function encryptWithRSA(
  plaintext: string | Buffer,
  publicKey: string
): string {
  try {
    const buffer = typeof plaintext === "string" ? Buffer.from(plaintext) : plaintext;
    return crypto
      .publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        buffer
      )
      .toString("hex");
  } catch (error) {
    console.error("RSA encryption error:", error);
    throw error;
  }
}

/**
 * Decrypt RSA-encrypted data with private key
 */
export function decryptWithRSA(
  encryptedData: string,
  privateKey: string,
  passphrase?: string
): Buffer {
  try {
    const passphraseFinal = passphrase || process.env.ENCRYPTION_PASSPHRASE || "default-passphrase";
    return crypto.privateDecrypt(
      {
        key: privateKey,
        passphrase: passphraseFinal,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(encryptedData, "hex")
    );
  } catch (error) {
    console.error("RSA decryption error:", error);
    throw error;
  }
}

/**
 * Generate fingerprint from public key
 */
export function generateFingerprint(publicKey: string): string {
  return crypto
    .createHash("sha256")
    .update(publicKey)
    .digest("hex")
    .toUpperCase()
    .match(/.{1,2}/g)
    ?.join(" ") || "";
}

/**
 * Hash email for privacy
 */
export function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email).digest("hex");
}
