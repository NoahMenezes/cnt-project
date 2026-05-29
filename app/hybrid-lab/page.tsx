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
    const lines = pem.split("\n").filter(l => !l.startsWith("---") && l.trim());
    const b64 = lines.join("");
    const raw = safeAtob(b64);
    const nums = raw.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const sorted = [...nums].sort((a, b) => b.length - a.length);
      return { e: BigInt(sorted[1]), n: BigInt(sorted[0]) };
    }
    const directNums = pem.match(/\d+/g);
    if (directNums && directNums.length >= 2) {
      const sorted = [...directNums].sort((a, b) => b.length - a.length);
      return { e: BigInt(sorted[1]), n: BigInt(sorted[0]) };
    }
    return null;
  } catch { return null; }
}

function extractRSAPrivateNumbers(pem: string): { d: bigint; n: bigint } | null {
  try {
    const lines = pem.split("\n").filter(l => !l.startsWith("---") && l.trim());
    const b64 = lines.join("");
    const raw = safeAtob(b64);
    const nums = raw.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const sorted = [...nums].sort((a, b) => b.length - a.length);
      return { d: BigInt(sorted[1]), n: BigInt(sorted[0]) };
    }
    const directNums = pem.match(/\d+/g);
    if (directNums && directNums.length >= 2) {
      const sorted = [...directNums].sort((a, b) => b.length - a.length);
      return { d: BigInt(sorted[1]), n: BigInt(sorted[0]) };
    }
    return null;
  } catch { return null; }
}

function aesDecryptSim(ciphertext: string): string {
  try {
    const dec = decodeURIComponent(atob(ciphertext));
    return dec.split("||SALT||")[0];
  } catch {
    return "";
  }
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
    (k.label.toLowerCase().includes(search.toLowerCase()) ||
      k.id.toLowerCase().includes(search.toLowerCase()))
  );

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
        plaintext = aesDecryptSim(rsaDecryptString(ciphertext, d, n));
        if (!plaintext) plaintext = aesDecryptSim(ciphertext.includes("-") ? rsaDecryptString(ciphertext, d, n) : ciphertext);
        void sessKey;
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
              <>
                {/* Flow Banner */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/50 font-mono">
                  {["Select Key", "Load Ciphertext", "Send", "Decrypt with Private Key", "Plaintext Recovered"].map((s, i, arr) => (
                    <React.Fragment key={s}>
                      <span className={`px-2 py-1 rounded-md border ${stage === ["select", "loaded", "sent", "sent", "decrypted"][i] ? "border-primary/50 bg-primary/10 text-primary" : "border-border/30 bg-background/30"}`}>{s}</span>
                      {i < arr.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 opacity-40" />}
                    </React.Fragment>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                  {/* LEFT – key picker */}
                  <div className="lg:col-span-2 space-y-4">

                    {/* Key ID input */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40">Paste Key ID</p>
                      <form onSubmit={handleKeyIdSubmit} className="flex gap-2">
                        <input
                          value={keyInputValue}
                          onChange={e => { setKeyInputValue(e.target.value); setKeyInputError(""); }}
                          placeholder="pub_1748453..."
                          className="flex-1 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-xs font-mono text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50"
                        />
                        <Button type="submit" size="sm" className="rounded-lg text-xs h-9 gap-1">
                          <Search className="h-3.5 w-3.5" /> Load
                        </Button>
                      </form>
                      {keyInputError && <p className="text-xs text-red-400">{keyInputError}</p>}
                    </motion.div>

                    {/* Key table */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40">Stored Public Keys</p>
                        <span className="text-xs text-foreground/30">{pubKeys.length} with payloads</span>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search keys…"
                          className="w-full rounded-lg border border-border/40 bg-background/40 pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                        {pubKeys.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <Inbox className="h-8 w-8 text-foreground/20" />
                            <p className="text-xs text-foreground/40">No RSA public keys with encrypted payloads found.</p>
                            <Link href="/analyze"><Button size="sm" variant="outline" className="rounded-full text-xs">Go to Operation Lab</Button></Link>
                          </div>
                        ) : pubKeys.map(k => (
                          <button key={k.id} onClick={() => handleSelectKey(k)}
                            className={`w-full text-left rounded-xl border p-3 transition-all space-y-1 ${selectedKey?.id === k.id ? "border-primary/50 bg-primary/5" : "border-border/30 bg-foreground/[0.02] hover:border-border/60 hover:bg-foreground/[0.04]"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">{k.label}</span>
                              </div>
                              <span className="text-[10px] text-foreground/30 font-mono">{k.keySize}b</span>
                            </div>
                            {k.plaintextSnippet && (
                              <p className="text-[10px] text-foreground/40 truncate pl-5">📄 {k.plaintextSnippet.slice(0, 60)}…</p>
                            )}
                            <p className="text-[10px] text-foreground/25 font-mono pl-5">{k.id}</p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* RIGHT – workspace */}
                  <div className="lg:col-span-3 space-y-4">

                    {stage === "select" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-2xl border border-dashed border-border/40 bg-background/30 p-12 flex flex-col items-center gap-4 text-center">
                        <Key className="h-12 w-12 text-foreground/15" />
                        <p className="text-sm text-foreground/40">Select a key from the table or paste a Key ID to load the encrypted document.</p>
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {stage !== "select" && selectedKey && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                          {/* Key Info Banner */}
                          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Shield className="h-4 w-4 text-blue-400 shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-foreground">{selectedKey.label}</p>
                                <p className="text-[10px] font-mono text-foreground/40">{selectedKey.id}</p>
                              </div>
                            </div>
                            <button onClick={reset} className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors">Change key</button>
                          </div>

                          {/* Plaintext snippet */}
                          {selectedKey.plaintextSnippet && (
                            <div className="rounded-xl border border-border/30 bg-foreground/[0.02] p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-foreground/40" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Original Plaintext (preview)</span>
                              </div>
                              <p className="text-xs text-foreground/60 leading-relaxed font-mono">
                                {selectedKey.plaintextSnippet}{selectedKey.plaintextSnippet.length >= 200 ? "…" : ""}
                              </p>
                            </div>
                          )}

                          {/* Ciphertext workspace */}
                          <div className="rounded-2xl border border-orange-500/20 bg-background/60 p-5 backdrop-blur space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-orange-400" />
                                <span className="text-xs font-bold uppercase tracking-widest text-foreground">Encrypted Ciphertext</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => navigator.clipboard.writeText(ciphertext)}
                                  className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/77 transition-colors">
                                  <Copy className="h-3 w-3" /> Copy
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={ciphertext}
                              onChange={e => setCiphertext(e.target.value)}
                              rows={8}
                              className="w-full rounded-xl border border-orange-500/10 bg-orange-500/[0.02] px-4 py-3 font-mono text-xs text-orange-400/80 focus:outline-none focus:border-orange-500/30 resize-y"
                            />
                            <div className="text-[10px] text-foreground/30 text-right">{ciphertext.length} chars</div>
                            {selectedKey.encryptedSessionKey && (
                              <div className="rounded-lg border border-border/20 bg-foreground/[0.02] p-3 space-y-1">
                                <p className="text-[10px] text-foreground/40 font-semibold uppercase tracking-wider">RSA-Encrypted AES Session Key</p>
                                <p className="font-mono text-[9px] text-foreground/60 truncate">{selectedKey.encryptedSessionKey}</p>
                              </div>
                            )}
                            {selectedKey.aesMode && (
                              <div className="flex gap-3 text-[10px] text-foreground/40">
                                <span>Mode: <span className="text-foreground/60">{selectedKey.aesMode}</span></span>
                                {selectedKey.aesIV && <span>IV: <span className="text-foreground/60 font-mono">{selectedKey.aesIV}</span></span>}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {stage === "loaded" && (
                            <div className="flex flex-wrap gap-3">
                              <Button onClick={handleDownloadEncrypted} variant="outline" className="gap-2 rounded-xl text-sm">
                                <Download className="h-4 w-4" /> Download Encrypted File
                              </Button>
                              <Button onClick={handleSend} disabled={isSending} className="gap-2 rounded-xl text-sm">
                                {isSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {isSending ? "Transmitting…" : "Send Encrypted Data"}
                              </Button>
                            </div>
                          )}

                          {stage === "sent" && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                              <p className="text-sm text-emerald-400">Encrypted bundle transmitted to recipient. Enter the RSA Private Key below to decrypt.</p>
                            </motion.div>
                          )}

                          {/* Private key + decrypt */}
                          {(stage === "sent" || stage === "decrypted") && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Unlock className="h-4 w-4 text-red-400" />
                                  <span className="text-xs font-bold uppercase tracking-widest text-foreground">Enter RSA Private Key</span>
                                </div>
                                <button onClick={() => setShowPrivKey(s => !s)} className="text-foreground/40 hover:text-foreground/70 transition-colors">
                                  {showPrivKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                              <textarea
                                value={privateKeyInput}
                                onChange={e => { setPrivateKeyInput(e.target.value); setDecryptError(""); }}
                                rows={4}
                                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;Paste the private key here…"
                                className={`w-full rounded-xl border border-border/40 bg-background/40 px-4 py-3 font-mono text-xs focus:outline-none focus:border-primary/50 resize-none transition-all ${showPrivKey ? "text-foreground/80" : "text-transparent [text-shadow:0_0_6px_rgba(255,255,255,0.3)]"}`}
                              />
                              {decryptError && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                  <p className="text-xs text-red-400">{decryptError}</p>
                                </div>
                              )}
                              {stage !== "decrypted" && (
                                <Button onClick={handleDecrypt} disabled={isDecrypting || !privateKeyInput.trim()} className="w-full gap-2 rounded-xl">
                                  {isDecrypting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                                  {isDecrypting ? "Decrypting…" : "Decrypt with Private Key"}
                                </Button>
                              )}
                            </motion.div>
                          )}

                          {/* Decrypted result */}
                          {stage === "decrypted" && decryptedText && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                              className="rounded-2xl border border-emerald-500/20 bg-background/60 p-5 backdrop-blur space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                                  <span className="text-xs font-bold uppercase tracking-widest text-foreground">Decrypted Plaintext</span>
                                </div>
                                <button onClick={() => navigator.clipboard.writeText(decryptedText)}
                                  className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors">
                                  <Copy className="h-3 w-3" /> Copy
                                </button>
                              </div>
                              <textarea value={decryptedText} readOnly rows={8}
                                className="w-full rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] px-4 py-3 font-mono text-xs text-foreground focus:outline-none resize-y" />
                              <div className="flex gap-3">
                                <Button onClick={() => {
                                  const blob = new Blob([decryptedText], { type: "text/plain" });
                                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                                  a.download = "decrypted_document.txt"; a.click();
                                }} variant="outline" className="gap-2 rounded-xl text-xs">
                                  <Download className="h-3.5 w-3.5" /> Download Plaintext
                                </Button>
                                <Button onClick={reset} variant="ghost" className="gap-2 rounded-xl text-xs">
                                  <RefreshCw className="h-3.5 w-3.5" /> Start Over
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </>
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
