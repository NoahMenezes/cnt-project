/**
 * SecureShare Crypto Library
 * Implements AES-GCM (256-bit) for data encryption 
 * Implements RSA-OAEP (SHA-256) for key encryption
 * Implements PBKDF2 for password-based key derivation
 */

// --- Constants ---
const AES_ALGO = { name: "AES-GCM", length: 256 };
const RSA_ALGO = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};
const PBKDF2_ALGO = {
    name: "PBKDF2",
    hash: "SHA-256",
    iterations: 100000,
};

// --- Utilities ---
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// --- RSA Key Management ---

/** Generate a new RSA Key Pair */
export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(RSA_ALGO, true, ["encrypt", "decrypt"]);
}

/** Export Public Key as Base64 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("spki", key);
    return arrayBufferToBase64(exported);
}

/** Import Public Key from Base64 */
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
    const buffer = base64ToArrayBuffer(base64Key);
    return await crypto.subtle.importKey("spki", buffer, RSA_ALGO, true, ["encrypt"]);
}

/** Export Private Key (Encrypted with Password) */
export async function exportPrivateKey(
    key: CryptoKey,
    password: string
): Promise<{ encryptedKey: string; salt: string; iv: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive AES key from password
    const pwData = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey("raw", pwData, "PBKDF2", false, ["deriveKey"]);
    const aesKey = await crypto.subtle.deriveKey(
        { ...PBKDF2_ALGO, salt: salt.buffer },
        baseKey,
        AES_ALGO,
        false,
        ["encrypt"]
    );

    // Export private key to PKCS#8
    const exportedKey = await crypto.subtle.exportKey("pkcs8", key);

    // Encrypt PKCS#8 key with AES
    const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv.buffer }, aesKey, exportedKey);

    return {
        encryptedKey: arrayBufferToBase64(encryptedBuffer),
        salt: arrayBufferToBase64(salt.buffer),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

/** Import Private Key (Decrypted with Password) */
export async function importPrivateKey(
    encryptedBase64: string,
    saltBase64: string,
    ivBase64: string,
    password: string
): Promise<CryptoKey> {
    const salt = base64ToArrayBuffer(saltBase64);
    const iv = base64ToArrayBuffer(ivBase64);
    const encrypted = base64ToArrayBuffer(encryptedBase64);

    // Derive AES key from password
    const pwData = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey("raw", pwData, "PBKDF2", false, ["deriveKey"]);
    const aesKey = await crypto.subtle.deriveKey(
        { ...PBKDF2_ALGO, salt: salt },
        baseKey,
        AES_ALGO,
        false,
        ["decrypt"]
    );

    // Decrypt PKCS#8 buffer
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, aesKey, encrypted);

    return await crypto.subtle.importKey("pkcs8", decrypted, RSA_ALGO, true, ["decrypt"]);
}

// --- AES Encryption ---

/** Generate random AES Key */
export async function generateAESKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(AES_ALGO, true, ["encrypt", "decrypt"]);
}

/** Encrypt Data (String or Buffer) with AES Key */
export async function encryptData(
    data: string | ArrayBuffer,
    key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const buffer = typeof data === "string" ? new TextEncoder().encode(data).buffer : data;

    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv.buffer }, key, buffer);

    return {
        encrypted: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

/** Decrypt Data with AES Key */
export async function decryptData(
    encryptedBase64: string,
    ivBase64: string,
    key: CryptoKey
): Promise<ArrayBuffer> {
    const encrypted = base64ToArrayBuffer(encryptedBase64);
    const iv = base64ToArrayBuffer(ivBase64);

    return await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted);
}

// --- Hybrid RSA-AES ---

/** Wrap (Encrypt) AES Key with RSA Public Key */
export async function wrapAESKey(aesKey: CryptoKey, rsaPublicKey: CryptoKey): Promise<string> {
    const rawAES = await crypto.subtle.exportKey("raw", aesKey);
    const wrapped = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsaPublicKey, rawAES);
    return arrayBufferToBase64(wrapped);
}

/** Unwrap (Decrypt) AES Key with RSA Private Key */
export async function unwrapAESKey(
    wrappedAESBase64: string,
    rsaPrivateKey: CryptoKey
): Promise<CryptoKey> {
    const wrapped = base64ToArrayBuffer(wrappedAESBase64);
    const rawAES = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, rsaPrivateKey, wrapped);
    return await crypto.subtle.importKey("raw", rawAES, AES_ALGO, true, ["encrypt", "decrypt"]);
}
