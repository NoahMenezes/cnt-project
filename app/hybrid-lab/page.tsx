"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Lock, Unlock, Layers, Copy, Eye, EyeOff,
  Download, Send, CheckCircle, AlertTriangle, Shield,
  FileText, RefreshCw, Search, ArrowRight, Inbox,
  Sliders, Sparkles, Check, ArrowDown, HelpCircle, Wand2
} from "lucide-react";
import { getKeys, CryptographicKey, syncKeysForUser } from "@/lib/store";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const NAV = [
  { title: "Home", href: "/" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Operation Lab", href: "/analyze" },
  { title: "Hybrid Lab", href: "/hybrid-lab", isActive: true },
  { title: "Reports", href: "/reports" },
  { title: "Key Vault", href: "/vault" },
  { title: "Profile", href: "/profile" },
];

// ── tiny RSA helpers (same sim as analyze page) ────────────────────────────
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

function rsaEncryptString(text: string, e: bigint, n: bigint): string {
  const cache = new Map<number, string>();
  const encryptedChunks = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    let cipherStr = cache.get(code);
    if (cipherStr === undefined) {
      const charCode = BigInt(code);
      const cipherCode = modPow(charCode, e, n);
      cipherStr = cipherCode.toString();
      cache.set(code, cipherStr);
    }
    encryptedChunks.push(cipherStr);
  }
  return encryptedChunks.join("-");
}

function rsaDecryptString(cipherText: string, d: bigint, n: bigint): string {
  const chunks = cipherText.split("-");
  const cache = new Map<string, string>();
  let out = "";
  for (const chunk of chunks) {
    if (!chunk) continue;
    let ch = cache.get(chunk);
    if (ch === undefined) {
      try {
        ch = String.fromCharCode(Number(modPow(BigInt(chunk), d, n)));
      } catch {
        ch = chunk.charAt(0) ? String.fromCharCode(chunk.charCodeAt(0) % 95 + 32) : "\uFFFD";
      }
      cache.set(chunk, ch);
    }
    out += ch;
  }
  return out;
}


// ── Parse our custom PEM format which embeds parameters as base64(JSON) ───────
// The analyze page generates:
//   -----BEGIN PUBLIC KEY-----
//   btoa(JSON.stringify({n, e}))
//   -----END PUBLIC KEY-----
// or the legacy line-per-number format:
//   btoa(n.toString())
//   btoa(e.toString())

function parsePEMParams(pem: string): Record<string, string> | null {
  try {
    const lines = pem.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("---"));
    if (lines.length === 0) return null;

    // Strategy A: Single line that decodes to JSON
    for (const line of lines) {
      try {
        const decoded = atob(line.replace(/[^A-Za-z0-9+/=]/g, "").padEnd(Math.ceil(line.length / 4) * 4, "="));
        if (decoded.startsWith("{")) {
          const obj = JSON.parse(decoded);
          if (typeof obj === "object") return obj as Record<string, string>;
        }
      } catch { /* try next */ }
    }

    // Strategy B: Each line decodes to a pure digit string (line-per-number format)
    const numLines: bigint[] = [];
    for (const line of lines) {
      try {
        const clean = line.replace(/[^A-Za-z0-9+/=]/g, "");
        const padded = clean.padEnd(Math.ceil(clean.length / 4) * 4, "=");
        const decoded = atob(padded);
        if (/^\d+$/.test(decoded)) {
          numLines.push(BigInt(decoded));
        }
      } catch { /* ignore */ }
    }
    if (numLines.length >= 2) {
      // Largest is n, second is d (or e)
      const sorted = [...numLines].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return { n: sorted[0].toString(), d: sorted[1].toString(), e: sorted[1].toString() };
    }

    return null;
  } catch {
    return null;
  }
}

function extractRSAPublicNumbers(pem: string): { e: bigint; n: bigint } | null {
  try {
    const params = parsePEMParams(pem);
    if (!params) return null;
    const n = BigInt(params.n ?? "0");
    const e = BigInt(params.e ?? "65537");
    if (n <= BigInt(0) || e <= BigInt(0)) return null;
    return { e, n };
  } catch { return null; }
}

function extractRSAPrivateNumbers(pem: string): { d: bigint; n: bigint } | null {
  try {
    const params = parsePEMParams(pem);
    if (!params) return null;
    const n = BigInt(params.n ?? "0");
    const d = BigInt(params.d ?? "0");
    if (n <= BigInt(0) || d <= BigInt(0)) return null;
    return { d, n };
  } catch { return null; }
}

// Detect if a string is an RSA-wrapped ciphertext (all chunks are pure decimal numbers)
function isRsaWrappedCiphertext(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.includes("-")) return false;
  const chunks = trimmed.split("-");
  return chunks.length > 1 && chunks.every(c => /^\d+$/.test(c.trim()));
}

function aesDecryptSim(ciphertext: string): string {
  // Base64-decode and strip the SALT marker embedded by aesEncryptSim in analyze/page.tsx
  // Format: btoa(encodeURIComponent(plaintext + "||SALT||" + keyPrefix))
  try {
    const cleaned = ciphertext.trim().replace(/\s+/g, "");
    // Pad to valid base64 length
    const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
    const decoded = decodeURIComponent(atob(padded));
    const saltIdx = decoded.indexOf("||SALT||");
    if (saltIdx !== -1) {
      return decoded.substring(0, saltIdx);
    }
    // No salt marker - return the full decoded string (might be plaintext directly)
    return decoded;
  } catch {
    return "";
  }
}


function getFileIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF Document";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "Word Document";
  if (lower.endsWith(".csv")) return "CSV Spreadsheet";
  if (lower.endsWith(".json")) return "JSON Data File";
  return "Document";
}

type Stage = "select" | "loaded" | "sent" | "decrypted";

export default function HybridLabPage() {
  const { user } = useUser();
  const [keys, setKeys] = useState<CryptographicKey[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user?.id) {
      syncKeysForUser(user.id);
    } else {
      syncKeysForUser("default-local-user");
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState<"simulator" | "playground">("simulator");

  // --- Simulator State ---
  const [selectedKey, setSelectedKey] = useState<CryptographicKey | null>(null);
  const [ciphertext, setCiphertext] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [stage, setStage] = useState<Stage>("select");
  const [decryptedText, setDecryptedText] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [keyInputValue, setKeyInputValue] = useState("");
  const [keyInputError, setKeyInputError] = useState("");
  const [isFixingGarbled, setIsFixingGarbled] = useState(false);
  const [correctedText, setCorrectedText] = useState("");
  const [fixError, setFixError] = useState("");

  // --- Playground State ---
  const [pgAesKey, setPgAesKey] = useState("");
  const [pgRsaPublicKey, setPgRsaPublicKey] = useState("");
  const [pgWrappedKey, setPgWrappedKey] = useState("");
  const [pgWrapError, setPgWrapError] = useState("");

  const [pgCiphertext, setPgCiphertext] = useState("");
  const [pgRsaPrivateKey, setPgRsaPrivateKey] = useState("");
  const [pgDecryptAesKeyInput, setPgDecryptAesKeyInput] = useState("");
  const [pgDecryptedAesKey, setPgDecryptedAesKey] = useState("");
  const [pgPlaintext, setPgPlaintext] = useState("");
  const [pgDecryptError, setPgDecryptError] = useState("");
  const [showPgPrivKey, setShowPgPrivKey] = useState(false);

  useEffect(() => {
    setKeys(getKeys());
    const handler = () => setKeys(getKeys());
    window.addEventListener("cipher_scope_db_update", handler);
    return () => window.removeEventListener("cipher_scope_db_update", handler);
  }, []);

  // --- Load page state from localStorage on mount ---
  useEffect(() => {
    try {
      const activeTabSaved = localStorage.getItem("hl_activeTab");
      if (activeTabSaved) setActiveTab(activeTabSaved as any);

      // Simulator
      const selectedKeyIdSaved = localStorage.getItem("hl_selectedKeyId");
      if (selectedKeyIdSaved) {
        const found = keys.find(k => k.id === selectedKeyIdSaved);
        if (found) setSelectedKey(found);
      }
      const ciphertextSaved = localStorage.getItem("hl_ciphertext");
      if (ciphertextSaved) setCiphertext(ciphertextSaved);
      const privateKeyInputSaved = localStorage.getItem("hl_privateKeyInput");
      if (privateKeyInputSaved) setPrivateKeyInput(privateKeyInputSaved);
      const showPrivKeySaved = localStorage.getItem("hl_showPrivKey");
      if (showPrivKeySaved) setShowPrivKey(showPrivKeySaved === "true");
      const stageSaved = localStorage.getItem("hl_stage");
      if (stageSaved) setStage(stageSaved as any);
      const decryptedTextSaved = localStorage.getItem("hl_decryptedText");
      if (decryptedTextSaved) setDecryptedText(decryptedTextSaved);
      const decryptErrorSaved = localStorage.getItem("hl_decryptError");
      if (decryptErrorSaved) setDecryptError(decryptErrorSaved);
      const keyInputValueSaved = localStorage.getItem("hl_keyInputValue");
      if (keyInputValueSaved) setKeyInputValue(keyInputValueSaved);

      // Playground
      const pgAesKeySaved = localStorage.getItem("hl_pgAesKey");
      if (pgAesKeySaved) setPgAesKey(pgAesKeySaved);
      const pgRsaPublicKeySaved = localStorage.getItem("hl_pgRsaPublicKey");
      if (pgRsaPublicKeySaved) setPgRsaPublicKey(pgRsaPublicKeySaved);
      const pgWrappedKeySaved = localStorage.getItem("hl_pgWrappedKey");
      if (pgWrappedKeySaved) setPgWrappedKey(pgWrappedKeySaved);
      const pgCiphertextSaved = localStorage.getItem("hl_pgCiphertext");
      if (pgCiphertextSaved) setPgCiphertext(pgCiphertextSaved);
      const pgRsaPrivateKeySaved = localStorage.getItem("hl_pgRsaPrivateKey");
      if (pgRsaPrivateKeySaved) setPgRsaPrivateKey(pgRsaPrivateKeySaved);
      const pgDecryptAesKeyInputSaved = localStorage.getItem("hl_pgDecryptAesKeyInput");
      if (pgDecryptAesKeyInputSaved) setPgDecryptAesKeyInput(pgDecryptAesKeyInputSaved);
      const pgDecryptedAesKeySaved = localStorage.getItem("hl_pgDecryptedAesKey");
      if (pgDecryptedAesKeySaved) setPgDecryptedAesKey(pgDecryptedAesKeySaved);
      const pgPlaintextSaved = localStorage.getItem("hl_pgPlaintext");
      if (pgPlaintextSaved) setPgPlaintext(pgPlaintextSaved);
      const pgDecryptErrorSaved = localStorage.getItem("hl_pgDecryptError");
      if (pgDecryptErrorSaved) setPgDecryptError(pgDecryptErrorSaved);
      const showPgPrivKeySaved = localStorage.getItem("hl_showPgPrivKey");
      if (showPgPrivKeySaved) setShowPgPrivKey(showPgPrivKeySaved === "true");
    } catch (e) {
      console.error("Error loading hybrid lab state:", e);
    }
  }, [keys]);

  // --- Save page state to localStorage reactively ---
  useEffect(() => {
    try {
      localStorage.setItem("hl_activeTab", activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (selectedKey) {
        localStorage.setItem("hl_selectedKeyId", selectedKey.id);
      } else {
        localStorage.removeItem("hl_selectedKeyId");
      }
    } catch {}
  }, [selectedKey]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_ciphertext", ciphertext);
    } catch {}
  }, [ciphertext]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_privateKeyInput", privateKeyInput);
    } catch {}
  }, [privateKeyInput]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_showPrivKey", String(showPrivKey));
    } catch {}
  }, [showPrivKey]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_stage", stage);
    } catch {}
  }, [stage]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_decryptedText", decryptedText);
    } catch {}
  }, [decryptedText]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_decryptError", decryptError);
    } catch {}
  }, [decryptError]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_keyInputValue", keyInputValue);
    } catch {}
  }, [keyInputValue]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgAesKey", pgAesKey);
    } catch {}
  }, [pgAesKey]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgRsaPublicKey", pgRsaPublicKey);
    } catch {}
  }, [pgRsaPublicKey]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgWrappedKey", pgWrappedKey);
    } catch {}
  }, [pgWrappedKey]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgCiphertext", pgCiphertext);
    } catch {}
  }, [pgCiphertext]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgRsaPrivateKey", pgRsaPrivateKey);
    } catch {}
  }, [pgRsaPrivateKey]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgDecryptAesKeyInput", pgDecryptAesKeyInput);
    } catch {}
  }, [pgDecryptAesKeyInput]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgDecryptedAesKey", pgDecryptedAesKey);
    } catch {}
  }, [pgDecryptedAesKey]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgPlaintext", pgPlaintext);
    } catch {}
  }, [pgPlaintext]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_pgDecryptError", pgDecryptError);
    } catch {}
  }, [pgDecryptError]);

  useEffect(() => {
    try {
      localStorage.setItem("hl_showPgPrivKey", String(showPgPrivKey));
    } catch {}
  }, [showPgPrivKey]);

  const pubKeys = keys.filter(k =>
    k.keyType === "RSA_PUBLIC" && k.ciphertextPayload &&
    ((k.label && k.label.toLowerCase().includes(search.toLowerCase())) ||
      k.id.toLowerCase().includes(search.toLowerCase()) ||
      (k.documentName && k.documentName.toLowerCase().includes(search.toLowerCase())))
  );

  const pairedPrivateKey = useMemo(() => {
    if (!selectedKey?.pairedKeyId) return null;
    return keys.find(k => k.id === selectedKey.pairedKeyId && k.keyType === "RSA_PRIVATE");
  }, [selectedKey, keys]);

  const handleSelectKey = useCallback((key: CryptographicKey) => {
    setSelectedKey(key);
    setCiphertext(key.ciphertextPayload ?? "");
    setStage("loaded");
    setDecryptedText("");
    setDecryptError("");
    setPrivateKeyInput("");
    setKeyInputValue("");
    setKeyInputError("");
  }, []);

  const handleKeyIdSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const id = keyInputValue.trim();
    const found = keys.find(k => k.id === id && k.keyType === "RSA_PUBLIC" && k.ciphertextPayload);
    if (!found) { setKeyInputError("No encrypted document found for this Key ID."); return; }
    setKeyInputError("");
    handleSelectKey(found);
  }, [keyInputValue, keys, handleSelectKey]);

  const handleDownloadEncrypted = () => {
    if (!ciphertext) return;
    const blob = new Blob([ciphertext], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `encrypted_${selectedKey?.id ?? "payload"}.enc`;
    a.click();
  };

  const handleSend = async () => {
    setIsSending(true);
    await new Promise(r => setTimeout(r, 1800));
    setIsSending(false);
    setStage("sent");
  };

  const handleDecrypt = async () => {
    if (!privateKeyInput.trim()) { setDecryptError("Paste the RSA Private Key to proceed."); return; }
    setIsDecrypting(true);
    setDecryptError("");
    await new Promise(r => setTimeout(r, 800));
    try {
      // Step 1: Parse the private key from PEM
      const parsed = extractRSAPrivateNumbers(privateKeyInput.trim());
      if (!parsed) {
        throw new Error("Could not read the RSA Private Key. Make sure you copied it completely from the Operation Lab (including the -----BEGIN and -----END lines).");
      }
      const { d, n } = parsed;

      // Step 2: Get the encrypted AES session key and ciphertext
      const encSessKey = selectedKey?.encryptedSessionKey ?? "";
      let plaintext = "";

      // ── Strategy A: Full hybrid decrypt (session key + ciphertext both present) ──────
      if (encSessKey && ciphertext) {
        // A1. RSA-decrypt the encrypted session key to recover the original AES key
        const aesKeyHex = rsaDecryptString(encSessKey, d, n);

        // A2. Determine if the ciphertext itself is RSA-wrapped or plain base64 AES
        let aesCiphertext = ciphertext;
        if (isRsaWrappedCiphertext(ciphertext)) {
          // ciphertext is RSA-encrypted (rsa_payload mode) → decrypt RSA layer first
          aesCiphertext = rsaDecryptString(ciphertext, d, n);
        }

        // A3. AES-decrypt the inner ciphertext
        plaintext = aesDecryptSim(aesCiphertext);

        if (plaintext) {
          setDecryptedText(plaintext);
          setStage("decrypted");
          setIsDecrypting(false);
          return;
        }
        
        // A4. Fallback: try the raw AES key hex as the ciphertext (if the stored payload IS the AES key hex)
        if (aesKeyHex) {
          const tryWithHex = aesDecryptSim(aesKeyHex);
          if (tryWithHex) {
            plaintext = tryWithHex;
            setDecryptedText(plaintext);
            setStage("decrypted");
            setIsDecrypting(false);
            return;
          }
        }
      }

      // ── Strategy B: No session key — try direct AES (standard mode) ──────
      if (!encSessKey && ciphertext) {
        plaintext = aesDecryptSim(ciphertext);
        if (plaintext) {
          setDecryptedText(plaintext);
          setStage("decrypted");
          setIsDecrypting(false);
          return;
        }
      }

      // ── Strategy C: Ciphertext is RSA-only wrapped (no AES layer) ──────
      if (isRsaWrappedCiphertext(ciphertext)) {
        const inner = rsaDecryptString(ciphertext, d, n);
        // inner might be plaintext directly or base64 AES
        const tryAes = aesDecryptSim(inner);
        plaintext = tryAes || inner;
        if (plaintext && plaintext.trim()) {
          setDecryptedText(plaintext);
          setStage("decrypted");
          setIsDecrypting(false);
          return;
        }
      }

      // ── Strategy D: Try decrypting the session key as ciphertext (edge case) ──────
      if (encSessKey && isRsaWrappedCiphertext(encSessKey)) {
        const inner = rsaDecryptString(encSessKey, d, n);
        const tryAes = aesDecryptSim(inner);
        plaintext = tryAes || inner;
        if (plaintext && plaintext.trim()) {
          setDecryptedText(plaintext);
          setStage("decrypted");
          setIsDecrypting(false);
          return;
        }
      }

      throw new Error(
        "Decryption returned empty. This usually means the private key doesn't match the one used to encrypt. " +
        "Go to Operation Lab, re-generate your keys, then copy the Private Key and paste it here."
      );
    } catch (err) {
      setDecryptError(`Decryption failed: ${err instanceof Error ? err.message : "Invalid key or corrupted ciphertext."}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!decryptedText) return;
    setIsFixingGarbled(true);
    setFixError("");
    setCorrectedText("");

    try {
      const res = await fetch("http://localhost:8000/analyze/fix-garbled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "default-local-user",
          fileName: selectedKey?.documentName || "Unknown Document",
          text: decryptedText,
        }),
      });
      if (!res.ok) throw new Error("Failed to fix garbled text");
      const data = await res.json();
      setCorrectedText(data.correctedText);
    } catch (err) {
      setFixError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsFixingGarbled(false);
    }
  };

  const reset = () => {
    setSelectedKey(null);
    setCiphertext("");
    setStage("select");
    setDecryptedText("");
    setDecryptError("");
    setPrivateKeyInput("");
    setKeyInputValue("");
    setKeyInputError("");
  };

  // --- Real-time Playground Computations ---
  // 1. RSA Key Wrapping (AES Key -> RSA Encrypted Key)
  useEffect(() => {
    if (!pgAesKey.trim() || !pgRsaPublicKey.trim()) {
      setPgWrappedKey("");
      setPgWrapError("");
      return;
    }
    try {
      const parsed = extractRSAPublicNumbers(pgRsaPublicKey);
      if (!parsed) {
        setPgWrapError("Invalid RSA Public Key PEM structure.");
        setPgWrappedKey("");
        return;
      }
      const { e, n } = parsed;
      const wrapped = rsaEncryptString(pgAesKey.trim(), e, n);
      setPgWrappedKey(wrapped);
      setPgWrapError("");
    } catch (err) {
      setPgWrapError("Key wrapping failed.");
      setPgWrappedKey("");
    }
  }, [pgAesKey, pgRsaPublicKey]);

  // 2. Real-time RSA Unwrapping of AES Session Key
  useEffect(() => {
    if (!pgWrappedKey.trim() || !pgRsaPrivateKey.trim()) {
      setPgDecryptedAesKey("");
      return;
    }
    try {
      const parsed = extractRSAPrivateNumbers(pgRsaPrivateKey);
      if (!parsed) return;
      const { d, n } = parsed;
      const unwrapped = rsaDecryptString(pgWrappedKey.trim(), d, n);
      if (unwrapped && unwrapped.length > 5) {
        setPgDecryptedAesKey(unwrapped);
        // Automatically prefill the decryption AES key input
        setPgDecryptAesKeyInput(unwrapped);
      }
    } catch {}
  }, [pgWrappedKey, pgRsaPrivateKey]);

  // 3. Real-time Decryption of Ciphertext Document
  useEffect(() => {
    if (!pgCiphertext.trim()) {
      setPgPlaintext("");
      setPgDecryptError("");
      return;
    }

    const aesKeyValue = pgDecryptAesKeyInput.trim();

    try {
      let workingCiphertext = pgCiphertext.trim().replace(/\s+/g, "");

      // Step 1: If ciphertext is in RSA-wrapped format (dash-separated numbers), RSA-decrypt first
      // An RSA-wrapped payload looks like: "12345-67890-11111-..." with pure number chunks
      const isRsaWrapped = workingCiphertext.includes("-") && workingCiphertext.split("-").every(c => /^\d+$/.test(c.trim()));
      if (isRsaWrapped && pgRsaPrivateKey.trim()) {
        const parsed = extractRSAPrivateNumbers(pgRsaPrivateKey);
        if (parsed) {
          const { d, n } = parsed;
          workingCiphertext = rsaDecryptString(workingCiphertext, d, n);
        }
      }

      // Step 2: AES decrypt - try base64 decode and split on SALT marker
      try {
        const cleaned = workingCiphertext.replace(/\s+/g, "");
        let padded = cleaned;
        while (padded.length % 4 !== 0) padded += "=";
        const dec = decodeURIComponent(atob(padded));
        const parts = dec.split("||SALT||");
        const recovered = parts[0];
        if (recovered && recovered.trim()) {
          setPgPlaintext(recovered);
          setPgDecryptError("");
        } else if (aesKeyValue) {
          setPgPlaintext("");
          setPgDecryptError("AES decryption returned empty. Check that the ciphertext and AES key are from the same Operation Lab session.");
        } else {
          setPgPlaintext("");
          setPgDecryptError("Paste the AES Session Key above to decrypt.");
        }
      } catch {
        // Base64 decode failed - the ciphertext might not be from this app's format
        setPgPlaintext("");
        setPgDecryptError("Could not decode ciphertext. Make sure it is copied directly from the Ciphertext Output in the Operation Lab.");
      }
    } catch {
      setPgPlaintext("");
      setPgDecryptError("Decryption failed. Verify the ciphertext is correctly formatted.");
    }
  }, [pgCiphertext, pgDecryptAesKeyInput, pgRsaPrivateKey]);

  const handleLoadDemoData = useCallback(() => {
    setPgAesKey("5d7e3a2b8c9d0e1f2a3b4c5d6e7f8a9b");
    setPgRsaPublicKey("-----BEGIN PUBLIC KEY-----\nNjQzODY5MzM5ODI2NjE=\nNjU1Mzc=\n-----END PUBLIC KEY-----");
    setPgWrappedKey("8558004898116-62416693054577-17086801462632-37845510878773-50660605962636-36640857652316-1738094783779-52388149354949-44883697935429-15684957561458-41476606189793-62416693054577-25969664356656-37845510878773-33746819099818-25595458048334-1738094783779-36640857652316-50660605962636-52388149354949-22374542698118-15684957561458-8558004898116-62416693054577-3768925979207-37845510878773-17086801462632-25595458048334-44883697935429-36640857652316-41476606189793-52388149354949");
    setPgCiphertext("Q09ORklERU5USUFMJTNBJTIwVGhlJTIwaHlicmlkJTIwZW5jcnlwdGlvbiUyMHByb3RvY29sJTIwaGFzJTIwYmVlbiUyMHN1Y2Nlc3NmdWxseSUyMHZlcmlmaWVkLiU3QyU3Q1NBTFQlN0MlN0M1ZDdlM2E=");
    setPgRsaPrivateKey("-----BEGIN RSA PRIVATE KEY-----\nNjQzODY5MzM5ODI2NjE=\nMjEyNjE4OTQyMjE4MjU=\n-----END RSA PRIVATE KEY-----");
    setPgDecryptAesKeyInput("5d7e3a2b8c9d0e1f2a3b4c5d6e7f8a9b");
    setPgWrapError("");
    setPgDecryptError("");
  }, []);

  const handleClearAllPlayground = useCallback(() => {
    setPgAesKey("");
    setPgRsaPublicKey("");
    setPgWrappedKey("");
    setPgCiphertext("");
    setPgRsaPrivateKey("");
    setPgDecryptAesKeyInput("");
    setPgPlaintext("");
    setPgWrapError("");
    setPgDecryptError("");
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <Header navigationData={NAV} />
      <div className="pt-20">
        <main className="relative min-h-[calc(100vh-80px)]">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/[0.03] blur-[140px]" />
          </div>
          <div className="px-4 sm:px-6 py-8 lg:py-12 max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-4 inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
                <Layers className="h-3.5 w-3.5" /> Hybrid RSA-AES Lab
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Hybrid Encryption Lab</h1>
              <p className="mt-2 text-foreground/60 max-w-2xl">
                Test and verify hybrid cryptographic pipelines. Secure your documents with fast AES session keys, and wrap those keys with asymmetric RSA keypairs.
              </p>
            </motion.div>

            {/* Tab Controls */}
            <div className="flex border-b border-border/20 max-w-md">
              <button
                onClick={() => setActiveTab("simulator")}
                className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "simulator" ? "border-primary text-foreground" : "border-transparent text-foreground/40 hover:text-foreground/70"}`}
              >
                Workflow Simulator
              </button>
              <button
                onClick={() => setActiveTab("playground")}
                className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "playground" ? "border-primary text-foreground" : "border-transparent text-foreground/40 hover:text-foreground/70"}`}
              >
                Manual Key Playground
              </button>
            </div>

            {activeTab === "simulator" ? (
              <div className="grid gap-6 lg:grid-cols-12">
                {/* LEFT COLUMN: Vault Documents List */}
                <div className="lg:col-span-4 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-4"
                  >
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Vault Documents</h2>
                      <p className="text-[10px] text-foreground/45 mt-0.5">Select an encrypted document payload to decrypt</p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by filename or key ID..."
                        className="w-full rounded-lg border border-border/45 bg-background/40 pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {pubKeys.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                          <Inbox className="h-8 w-8 text-foreground/20" />
                          <p className="text-xs text-foreground/40">No matching document payloads found in Vault.</p>
                          <Link href="/analyze">
                            <Button size="sm" variant="outline" className="rounded-xl text-xs">
                              Go to Operation Lab
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        pubKeys.map(k => (
                          <button
                            key={k.id}
                            onClick={() => handleSelectKey(k)}
                            className={`w-full text-left rounded-xl border p-3 transition-all space-y-1.5 ${
                              selectedKey?.id === k.id
                                ? "border-primary/50 bg-primary/5"
                                : "border-border/30 bg-foreground/[0.02] hover:border-border/60 hover:bg-foreground/[0.04]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                                  {k.documentName || "Untitled Payload"}
                                </span>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                                {k.keySize}b RSA
                              </span>
                            </div>
                            {k.plaintextSnippet && (
                              <p className="text-[10px] text-foreground/40 line-clamp-1 font-mono pl-5.5">
                                {k.plaintextSnippet}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-[9px] text-foreground/25 pl-5.5">
                              <span>ID: {k.id.slice(0, 10)}...</span>
                              <span>{new Date(k.generatedAt).toLocaleDateString()}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* RIGHT COLUMN: Action & Recovery Workspace */}
                <div className="lg:col-span-8 space-y-4">
                  {stage === "select" || !selectedKey ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full min-h-[350px] rounded-2xl border border-dashed border-border/40 bg-background/30 p-12 flex flex-col items-center justify-center gap-4 text-center"
                    >
                      <Unlock className="h-10 w-10 text-foreground/15" />
                      <div>
                        <p className="text-sm font-semibold text-foreground/70">No Document Selected</p>
                        <p className="text-xs text-foreground/40 max-w-xs mt-1 mx-auto">
                          Select an encrypted document payload from the list on the left to begin decryption.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Document Header Banner */}
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4.5 w-4.5 text-blue-400 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{selectedKey.documentName || "Untitled Payload"}</p>
                            <p className="text-[9px] font-mono text-foreground/40">Modulus ID: {selectedKey.id}</p>
                          </div>
                        </div>
                        <button
                          onClick={reset}
                          className="text-[11px] text-foreground/40 hover:text-foreground/75 transition-colors font-medium"
                        >
                          Change Document
                        </button>
                      </div>

                      {/* Ciphertext Box */}
                      <div className="rounded-2xl border border-orange-500/20 bg-background/60 p-5 backdrop-blur space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground/75">Encrypted Payload (Ciphertext)</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ciphertext);
                              }}
                              className="flex items-center gap-1 text-[11px] text-foreground/40 hover:text-foreground/75 transition-colors"
                            >
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                            <button
                              onClick={handleDownloadEncrypted}
                              className="flex items-center gap-1 text-[11px] text-foreground/40 hover:text-foreground/75 transition-colors"
                            >
                              <Download className="h-3 w-3" /> Download
                            </button>
                          </div>
                        </div>

                        <textarea
                          value={ciphertext}
                          readOnly
                          rows={4}
                          className="w-full rounded-xl border border-orange-500/10 bg-orange-500/[0.02] px-4 py-3 font-mono text-[11px] text-orange-400/80 focus:outline-none resize-none"
                        />

                        {selectedKey.encryptedSessionKey && (
                          <div className="rounded-lg border border-border/15 bg-foreground/[0.01] p-3 space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] text-foreground/40 font-semibold uppercase tracking-wider">
                              <span>RSA-Encrypted AES Session Key</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedKey.encryptedSessionKey || "");
                                }}
                                className="hover:text-foreground/70 flex items-center gap-0.5"
                              >
                                <Copy className="h-2.5 w-2.5" /> Copy Key
                              </button>
                            </div>
                            <p className="font-mono text-[10px] text-foreground/55 break-all line-clamp-1">{selectedKey.encryptedSessionKey}</p>
                            {selectedKey.aesMode && (
                              <div className="flex gap-3 text-[9px] text-foreground/35 border-t border-border/5 pt-1.5">
                                <span>Algorithm: <span className="text-foreground/50 font-semibold">AES-{selectedKey.aesMode}</span></span>
                                {selectedKey.aesIV && <span>IV: <span className="text-foreground/50 font-mono">{selectedKey.aesIV.substring(0, 16)}...</span></span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Decryption Chamber */}
                      <div className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-4">
                        <div className="flex items-center justify-between border-b border-border/10 pb-2">
                          <div className="flex items-center gap-2">
                            <Unlock className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground/75">Decryption Area</span>
                          </div>
                          
                          {pairedPrivateKey && stage !== "decrypted" && (
                            <button
                              onClick={() => {
                                setPrivateKeyInput(pairedPrivateKey.keyValue);
                              }}
                              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3 animate-pulse" /> Auto-fill matching Private Key
                            </button>
                          )}
                        </div>

                        {stage !== "decrypted" ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <textarea
                                value={privateKeyInput}
                                onChange={e => { setPrivateKeyInput(e.target.value); setDecryptError(""); }}
                                rows={4}
                                placeholder="Paste the matching RSA Private Key PEM to decrypt the session key and document..."
                                className={`w-full rounded-xl border border-border/45 bg-background/40 px-4 py-3 font-mono text-xs focus:outline-none focus:border-primary/50 resize-none transition-all ${
                                  showPrivKey ? "text-foreground/80" : "text-transparent [text-shadow:0_0_6px_rgba(255,255,255,0.35)]"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPrivKey(s => !s)}
                                className="absolute right-3.5 top-3.5 text-foreground/35 hover:text-foreground/60 transition-colors"
                              >
                                {showPrivKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>

                            {decryptError && (
                              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-400">{decryptError}</p>
                              </div>
                            )}

                            <Button
                              onClick={handleDecrypt}
                              disabled={isDecrypting || !privateKeyInput.trim()}
                              className="w-full gap-2 rounded-xl text-xs h-10 font-bold"
                            >
                              {isDecrypting ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Unlock className="h-3.5 w-3.5" />
                              )}
                              {isDecrypting ? "Decrypting document..." : "Decrypt Document"}
                            </Button>
                          </div>
                        ) : (
                          // Decrypted successfully
                          <div className="space-y-3">
                            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
                              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-emerald-400 font-semibold">
                                Plaintext document successfully recovered! RSA session key decrypted and AES payload fully restored.
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] text-foreground/45 font-semibold uppercase tracking-wider">
                                <span>Recovered Plaintext Content</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(decryptedText);
                                  }}
                                  className="hover:text-foreground/75 flex items-center gap-1 text-[11px]"
                                >
                                  <Copy className="h-3 w-3" /> Copy Plaintext
                                </button>
                              </div>
                              <textarea
                                value={decryptedText}
                                readOnly
                                rows={6}
                                className="w-full rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] px-4 py-3 font-mono text-xs text-foreground focus:outline-none resize-none"
                              />
                            </div>

                            <div className="flex gap-2 pt-1">
                              <Button
                                onClick={() => {
                                  const blob = new Blob([decryptedText], { type: "text/plain" });
                                  const a = document.createElement("a");
                                  a.href = URL.createObjectURL(blob);
                                  a.download = `recovered_${selectedKey.documentName || "doc"}.txt`;
                                  a.click();
                                }}
                                variant="outline"
                                className="gap-2 rounded-xl text-xs h-9"
                              >
                                <Download className="h-3.5 w-3.5" /> Download Document
                              </Button>
                              <Button
                                onClick={handleAIAnalysis}
                                disabled={isFixingGarbled}
                                className="gap-2 rounded-xl text-xs h-9 bg-purple-500 hover:bg-purple-600 text-white"
                              >
                                {isFixingGarbled ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                                AI Error Correction
                              </Button>
                              <Button
                                onClick={() => {
                                  setPrivateKeyInput("");
                                  setDecryptedText("");
                                  setStage("loaded");
                                }}
                                variant="ghost"
                                className="gap-2 rounded-xl text-xs h-9 text-foreground/50 hover:text-foreground ml-auto"
                              >
                                <RefreshCw className="h-3.5 w-3.5" /> Start Over
                              </Button>
                            </div>

                            {fixError && (
                              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-400 font-semibold">{fixError}</p>
                              </div>
                            )}

                            {correctedText && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 space-y-3 pt-4 border-t border-border/10"
                              >
                                <div className="flex items-start gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2.5">
                                  <CheckCircle className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                                  <p className="text-xs text-purple-400 font-semibold">
                                    AI Error Correction successfully done! Mojibake and encoding artifacts resolved.
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[10px] text-foreground/45 font-semibold uppercase tracking-wider">
                                    <span>Corrected Plaintext Content</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(correctedText)}
                                      className="hover:text-foreground/75 flex items-center gap-1 text-[11px]"
                                    >
                                      <Copy className="h-3 w-3" /> Copy
                                    </button>
                                  </div>
                                  <textarea
                                    value={correctedText}
                                    readOnly
                                    rows={8}
                                    className="w-full rounded-xl border border-purple-500/20 bg-purple-500/[0.02] px-4 py-3 font-mono text-xs text-foreground focus:outline-none resize-none shadow-[inset_0_0_20px_rgba(168,85,247,0.03)]"
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    const blob = new Blob([correctedText], { type: "text/plain" });
                                    const a = document.createElement("a");
                                    a.href = URL.createObjectURL(blob);
                                    a.download = `corrected_${selectedKey.documentName || "doc"}.txt`;
                                    a.click();
                                  }}
                                  className="gap-2 rounded-xl text-xs h-9 w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white"
                                >
                                  <Download className="h-3.5 w-3.5" /> Download Corrected Document
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              /* --- Interactive Cryptographic Playground Tab --- */
              <div className="space-y-6">
                {/* Guide & Preset Controller Banner */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-primary/25 bg-primary/5 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
                      <h3 className="text-sm font-bold text-foreground">Interactive Playground Sandbox</h3>
                    </div>
                    <p className="text-xs text-foreground/60 max-w-2xl leading-relaxed">
                      This sandbox lets you manually wrap a symmetric key with an RSA public key, and then decrypt the final payload. If you are new to hybrid encryption, click <strong>Load Demo Scenario</strong> to run a pre-configured flow.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 shrink-0">
                    <Button
                      onClick={handleLoadDemoData}
                      size="sm"
                      className="rounded-xl text-xs h-9 font-bold bg-primary hover:bg-primary/95 text-primary-foreground gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Load Demo Scenario
                    </Button>
                    <Button
                      onClick={handleClearAllPlayground}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs h-9 text-foreground/60 border-border/40 hover:text-foreground hover:bg-background/80"
                    >
                      Reset Sandbox
                    </Button>
                  </div>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-2">

                  {/* Left Card: Key Wrapping Sandbox */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-5">
                    <div className="flex items-center justify-between border-b border-border/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-400" />
                        <div>
                          <h2 className="text-base font-bold text-foreground">Asymmetric Key Wrapping</h2>
                          <p className="text-xs text-foreground/40">Encrypt an AES Session Key using an RSA Public Key</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5">
                        RSA Wrap
                      </Badge>
                    </div>

                    {/* AES Session Key Input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">AES Session Key</label>
                        <button
                          onClick={() => {
                            const randKey = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
                            setPgAesKey(randKey);
                          }}
                          className="text-[10px] text-primary hover:underline font-semibold"
                        >
                          Generate random key
                        </button>
                      </div>
                      <input
                        type="text"
                        value={pgAesKey}
                        onChange={e => setPgAesKey(e.target.value)}
                        placeholder="Paste AES Session Key (e.g. 5d7e3a2b...)"
                        className="w-full rounded-xl border border-border/40 bg-background/40 px-3.5 py-2.5 text-xs font-mono text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    {/* RSA Public Key PEM Input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider block">RSA Public Key (PEM)</label>
                        {keys.filter(k => k.keyType === "RSA_PUBLIC").length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] text-foreground/30 mr-1">Autofill:</span>
                            {keys.filter(k => k.keyType === "RSA_PUBLIC").slice(0, 2).map(k => (
                              <button
                                key={k.id}
                                onClick={() => {
                                  setPgRsaPublicKey(k.keyValue);
                                }}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/15 font-mono truncate max-w-[80px]"
                                title={k.label || k.documentName}
                              >
                                {k.label || k.documentName || k.id.substring(0, 6)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <textarea
                        value={pgRsaPublicKey}
                        onChange={e => setPgRsaPublicKey(e.target.value)}
                        rows={5}
                        placeholder="-----BEGIN PUBLIC KEY-----&#10;Paste public key PEM here..."
                        className="w-full rounded-xl border border-border/40 bg-background/40 px-3.5 py-2.5 text-xs font-mono text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 resize-none"
                      />
                    </div>

                  {/* Output Wrapped Key */}
                  <div className="pt-3 border-t border-border/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">RSA-Encrypted Session Key</span>
                      {pgWrappedKey && (
                        <button
                          onClick={() => navigator.clipboard.writeText(pgWrappedKey)}
                          className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/75 transition-colors"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      )}
                    </div>
                    <textarea
                      value={pgWrappedKey}
                      readOnly
                      rows={4}
                      placeholder="Enter parameters above to calculate..."
                      className="w-full rounded-xl border border-blue-500/10 bg-blue-500/[0.02] px-3.5 py-2.5 font-mono text-xs text-blue-400/80 focus:outline-none resize-none"
                    />
                    {pgWrapError && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {pgWrapError}
                      </p>
                    )}
                    {!pgWrapError && pgWrappedKey && (
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check className="h-3.5 w-3.5" /> Key wrapped successfully using RSA (C = M^e mod n)
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Right Card: Hybrid Decryption Sandbox */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-5">
                  <div className="flex items-center justify-between border-b border-border/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Unlock className="h-5 w-5 text-emerald-400" />
                      <div>
                        <h2 className="text-base font-bold text-foreground">Symmetric & Asymmetric Decryption</h2>
                        <p className="text-xs text-foreground/40">Restore the original plaintext document from ciphertext</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                      Decrypt
                    </Badge>
                  </div>

                  {/* Encrypted Ciphertext Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider block">Encrypted Ciphertext</label>
                      {keys.filter(k => k.keyType === "RSA_PUBLIC" && k.ciphertextPayload).length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] text-foreground/30 mr-1">Autofill:</span>
                          {keys.filter(k => k.keyType === "RSA_PUBLIC" && k.ciphertextPayload).slice(0, 2).map(k => (
                            <button
                              key={k.id}
                              onClick={() => {
                                setPgCiphertext(k.ciphertextPayload || "");
                                if (k.encryptedSessionKey) {
                                  setPgWrappedKey(k.encryptedSessionKey);
                                }
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 border border-orange-500/15 font-mono truncate max-w-[80px]"
                              title={k.documentName}
                            >
                              {k.documentName || k.id.substring(0, 6)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <textarea
                      value={pgCiphertext}
                      onChange={e => setPgCiphertext(e.target.value)}
                      rows={3}
                      placeholder="Paste ciphertext here..."
                      className="w-full rounded-xl border border-border/40 bg-background/40 px-3.5 py-2.5 text-xs font-mono text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 resize-y"
                    />
                  </div>

                  {/* RSA Private Key PEM (Optional/Required if Ciphertext is wrapped) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">RSA Private Key (PEM)</label>
                        <button onClick={() => setShowPgPrivKey(s => !s)} className="text-foreground/45 hover:text-foreground/75">
                          {showPgPrivKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                      {keys.filter(k => k.keyType === "RSA_PRIVATE").length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] text-foreground/30 mr-1">Autofill:</span>
                          {keys.filter(k => k.keyType === "RSA_PRIVATE").slice(0, 2).map(k => (
                            <button
                              key={k.id}
                              onClick={() => {
                                setPgRsaPrivateKey(k.keyValue);
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/15 font-mono truncate max-w-[80px]"
                              title={k.label || k.documentName}
                            >
                              {k.label || k.documentName || k.id.substring(0, 6)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <textarea
                      value={pgRsaPrivateKey}
                      onChange={e => setPgRsaPrivateKey(e.target.value)}
                      rows={3}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;Paste private key PEM here..."
                      className={`w-full rounded-xl border border-border/40 bg-background/40 px-3.5 py-2.5 text-xs font-mono placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 resize-none transition-all ${showPgPrivKey ? "text-foreground/80" : "text-transparent [text-shadow:0_0_6px_rgba(255,255,255,0.3)]"}`}
                    />
                  </div>

                  {/* AES Session Key Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">AES Session Key</label>
                      {pgDecryptedAesKey && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Auto-decrypted from wrapped key
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pgDecryptAesKeyInput}
                      onChange={e => setPgDecryptAesKeyInput(e.target.value)}
                      placeholder="Paste AES Session Key to decrypt payload..."
                      className="w-full rounded-xl border border-border/40 bg-background/40 px-3.5 py-2.5 text-xs font-mono text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Decrypted Restored Plaintext Output */}
                  <div className="pt-3 border-t border-border/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Restored Plaintext Document</span>
                      {pgPlaintext && (
                        <button
                          onClick={() => navigator.clipboard.writeText(pgPlaintext)}
                          className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/75 transition-colors"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      )}
                    </div>
                    <textarea
                      value={pgPlaintext}
                      readOnly
                      rows={5}
                      placeholder="Decrypted plaintext will display here..."
                      className="w-full rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] px-3.5 py-2.5 font-mono text-xs text-foreground focus:outline-none resize-y"
                    />
                    {pgDecryptError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">{pgDecryptError}</p>
                      </div>
                    )}
                    {!pgDecryptError && pgPlaintext && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const blob = new Blob([pgPlaintext], { type: "text/plain" });
                            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                            a.download = "restored_document.txt"; a.click();
                          }}
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-xl text-xs h-8"
                        >
                          <Download className="h-3.5 w-3.5" /> Download Restored Document
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>

              </div>
            </div>
          )}

          </div>
        </main>
      </div>
    </div>
  );
}
