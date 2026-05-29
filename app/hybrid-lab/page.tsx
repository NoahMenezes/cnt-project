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
  Sliders, Sparkles, Check, ArrowDown, HelpCircle
} from "lucide-react";
import { getKeys, CryptographicKey } from "@/lib/store";
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

function safeAtob(str: string): string {
  try {
    let clean = str.replace(/[^A-Za-z0-9+/=]/g, "");
    while (clean.length % 4 !== 0) {
      clean += "=";
    }
    return atob(clean);
  } catch {
    return "";
  }
}

function extractRSAPublicNumbers(pem: string): { e: bigint; n: bigint } | null {
  try {
    const lines = pem.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("---"));
    const decodedLines: string[] = [];
    for (const line of lines) {
      const decoded = safeAtob(line);
      if (decoded && /^\d+$/.test(decoded)) {
        decodedLines.push(decoded);
      }
    }
    
    // New format: lines decode to pure digits
    if (decodedLines.length >= 2) {
      const numbers = decodedLines.map(BigInt);
      const sorted = [...numbers].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return { e: sorted[1], n: sorted[0] };
    }
    
    // Fallback: joined base64 block
    const b64 = lines.join("");
    const raw = safeAtob(b64);
    const nums = raw.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const sorted = [...nums].map(BigInt).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return { e: sorted[1], n: sorted[0] };
    }
    
    // Direct matches in raw text fallback
    const directNums = pem.match(/\d+/g);
    if (directNums && directNums.length >= 2) {
      const sorted = [...directNums].map(BigInt).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return { e: sorted[1], n: sorted[0] };
    }
    return null;
  } catch { return null; }
}

function extractRSAPrivateNumbers(pem: string): { d: bigint; n: bigint } | null {
  try {
    const lines = pem.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("---"));
    const decodedLines: string[] = [];
    for (const line of lines) {
      const decoded = safeAtob(line);
      if (decoded && /^\d+$/.test(decoded)) {
        decodedLines.push(decoded);
      }
    }
    
    // New format: lines decode to pure digits
    if (decodedLines.length >= 2) {
      const numbers = decodedLines.map(BigInt);
      const sorted = [...numbers].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return { d: sorted[1], n: sorted[0] };
    }
    
    // Fallback: joined base64 block
    const b64 = lines.join("");
    const raw = safeAtob(b64);
    const nums = raw.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const sorted = [...nums].map(BigInt).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return { d: sorted[1], n: sorted[0] };
    }
    
    // Direct matches in raw text fallback
    const directNums = pem.match(/\d+/g);
    if (directNums && directNums.length >= 2) {
      const sorted = [...directNums].map(BigInt).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return { d: sorted[1], n: sorted[0] };
    }
    return null;
  } catch { return null; }
}

function aesDecryptSim(ciphertext: string, keyHex?: string): string {
  try {
    const dec = decodeURIComponent(atob(ciphertext));
    const parts = dec.split("||SALT||");
    if (keyHex) {
      const keyInCiphertext = parts[1]?.trim();
      const prefix = keyHex.trim().substring(0, 6);
      if (keyInCiphertext && keyInCiphertext.toLowerCase() !== prefix.toLowerCase()) {
        return "";
      }
    }
    return parts[0];
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
  const [keys, setKeys] = useState<CryptographicKey[]>([]);
  const [search, setSearch] = useState("");
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
    if (!privateKeyInput.trim()) { setDecryptError("Please paste the RSA Private Key."); return; }
    setIsDecrypting(true);
    setDecryptError("");
    await new Promise(r => setTimeout(r, 900));
    try {
      const parsed = extractRSAPrivateNumbers(privateKeyInput);
      if (!parsed) throw new Error("Could not parse private key.");
      const { d, n } = parsed;
      const encSessKey = selectedKey?.encryptedSessionKey ?? "";
      let plaintext = "";
      if (encSessKey) {
        const sessKey = rsaDecryptString(encSessKey, d, n);
        const aesCipher = ciphertext.includes("-") ? rsaDecryptString(ciphertext, d, n) : ciphertext;
        plaintext = aesDecryptSim(aesCipher, sessKey);
      } else {
        plaintext = aesDecryptSim(ciphertext);
      }
      if (!plaintext) throw new Error("Decryption returned empty result.");
      setDecryptedText(plaintext);
      setStage("decrypted");
    } catch (err) {
      setDecryptError(`Decryption failed: ${err instanceof Error ? err.message : "Invalid key or corrupted ciphertext."}`);
    } finally {
      setIsDecrypting(false);
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

    const aesKey = pgDecryptAesKeyInput.trim();
    if (!aesKey) {
      setPgPlaintext("");
      setPgDecryptError("AES Session Key required to decrypt.");
      return;
    }

    try {
      let workingCiphertext = pgCiphertext.trim();

      // If the ciphertext is RSA-wrapped (has dashes), try to decrypt it using the Private Key first
      if (workingCiphertext.includes("-")) {
        if (pgRsaPrivateKey.trim()) {
          const parsed = extractRSAPrivateNumbers(pgRsaPrivateKey);
          if (parsed) {
            const { d, n } = parsed;
            workingCiphertext = rsaDecryptString(workingCiphertext, d, n);
          }
        }
      }

      // AES Decrypt Sim
      try {
        const dec = decodeURIComponent(atob(workingCiphertext));
        const parts = dec.split("||SALT||");
        setPgPlaintext(parts[0]);
        setPgDecryptError("");
      } catch {
        // Mismatched / broken key: return garbled text representing character break
        const garbled = workingCiphertext
          .split("")
          .map((ch, idx) => (idx % 3 === 0 ? "⚠" : String.fromCharCode((ch.charCodeAt(0) % 95) + 32)))
          .join("")
          .substring(0, 400);
        setPgPlaintext(garbled);
        setPgDecryptError("Decryption failed. Mismatched AES session key or corrupted ciphertext.");
      }
    } catch (err) {
      setPgPlaintext("");
      setPgDecryptError("Decryption failed due to invalid ciphertext format.");
    }
  }, [pgCiphertext, pgDecryptAesKeyInput, pgRsaPrivateKey]);

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
              <div className="grid gap-6 lg:grid-cols-5">
                {/* LEFT COLUMN: Vault Documents List */}
                <div className="lg:col-span-2 space-y-4">
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
                <div className="lg:col-span-3 space-y-4">
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
                                onClick={() => {
                                  setPrivateKeyInput("");
                                  setDecryptedText("");
                                  setStage("loaded");
                                }}
                                variant="ghost"
                                className="gap-2 rounded-xl text-xs h-9 text-foreground/50 hover:text-foreground"
                              >
                                <RefreshCw className="h-3.5 w-3.5" /> Start Over
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              /* --- Interactive Cryptographic Playground Tab --- */
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
                        className="text-[10px] text-primary hover:underline"
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
                    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider block">RSA Public Key (PEM)</label>
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
                    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider block">Encrypted Ciphertext</label>
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
                      <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">RSA Private Key (PEM) <span className="text-[10px] text-foreground/30 font-normal lowercase">(only if ciphertext contains RSA layer)</span></label>
                      <button onClick={() => setShowPgPrivKey(s => !s)} className="text-foreground/40 hover:text-foreground/75">
                        {showPgPrivKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
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
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
