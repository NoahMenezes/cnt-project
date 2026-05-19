"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Eye, EyeOff, Copy, RefreshCw, Check } from "lucide-react";

export function EmailEncryptionDemo() {
  const [step, setStep] = useState<"plaintext" | "aes" | "rsa" | "bundle">("plaintext");
  const [showDetails, setShowDetails] = useState(true);
  const [copied, setCopied] = useState(false);

  const plaintext = "Confidential project report - Q2 budget review.";
  const aesKey = "A4B7F2D1E9C3F6A8B1D4E7F0A3C6F9B2";
  const encryptedAES = "U2FsdGVkX19vR1K5d+A5K7X0B8ZmP2L9N3Q4R5S6T7U8V9W0X1Y2Z3A4B5";
  const rsaWrapped = "0x8F3A2B1D7C4E9A0F1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        switch (prev) {
          case "plaintext":
            return "aes";
          case "aes":
            return "rsa";
          case "rsa":
            return "bundle";
          case "bundle":
            return "plaintext";
        }
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full py-20 px-6 max-w-5xl mx-auto relative z-20">
      {/* Decorative Blur */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center mb-16">
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold bg-cyan-400/10 px-3 py-1 rounded-full">
          Hybrid Encryption Workflow
        </span>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
          How Email Encryption Works
        </h2>
        <p className="mt-4 text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
          Watch how your email is protected using hybrid AES-256 + RSA-2048 encryption.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Visual Workflow */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="liquid-glass border border-white/10 rounded-2xl p-8 space-y-6"
        >
          <h3 className="text-lg font-bold text-white">Step-by-Step Process</h3>

          {/* Step 1: Plaintext */}
          <motion.button
            onClick={() => setStep("plaintext")}
            whileHover={{ scale: 1.02 }}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              step === "plaintext"
                ? "border-cyan-400/50 bg-cyan-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/20 text-cyan-400 font-bold text-sm">
                1
              </div>
              <h4 className="font-semibold text-white">Plaintext Email</h4>
            </div>
            <p className="text-xs text-white/60 ml-11">Your message in readable form</p>
          </motion.button>

          {/* Step 2: AES Encryption */}
          <motion.button
            onClick={() => setStep("aes")}
            whileHover={{ scale: 1.02 }}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              step === "aes"
                ? "border-emerald-400/50 bg-emerald-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                2
              </div>
              <h4 className="font-semibold text-white">AES-256 Encryption</h4>
            </div>
            <p className="text-xs text-white/60 ml-11">Encrypt message with symmetric key</p>
          </motion.button>

          {/* Step 3: RSA Wrap */}
          <motion.button
            onClick={() => setStep("rsa")}
            whileHover={{ scale: 1.02 }}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              step === "rsa"
                ? "border-purple-400/50 bg-purple-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400 font-bold text-sm">
                3
              </div>
              <h4 className="font-semibold text-white">RSA-2048 Key Wrap</h4>
            </div>
            <p className="text-xs text-white/60 ml-11">Encrypt AES key with recipient's public key</p>
          </motion.button>

          {/* Step 4: Bundle */}
          <motion.button
            onClick={() => setStep("bundle")}
            whileHover={{ scale: 1.02 }}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              step === "bundle"
                ? "border-amber-400/50 bg-amber-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400 font-bold text-sm">
                4
              </div>
              <h4 className="font-semibold text-white">Encrypted Bundle</h4>
            </div>
            <p className="text-xs text-white/60 ml-11">Ready to transmit securely</p>
          </motion.button>
        </motion.div>

        {/* Content Display */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="liquid-glass border border-white/10 rounded-2xl p-8"
        >
          <h3 className="text-lg font-bold text-white mb-6">Content Preview</h3>

          <AnimatePresence mode="wait">
            {step === "plaintext" && (
              <motion.div
                key="plaintext"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-black/40 p-4 rounded-lg border border-cyan-500/20">
                  <p className="text-xs text-white/50 mb-2 font-mono">PLAINTEXT</p>
                  <p className="text-white leading-relaxed">{plaintext}</p>
                </div>
                <p className="text-xs text-white/60">
                  ✓ Readable on your local device before encryption
                </p>
              </motion.div>
            )}

            {step === "aes" && (
              <motion.div
                key="aes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-black/40 p-4 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-white/50 mb-2 font-mono">AES-256-GCM KEY</p>
                  <p className="text-white/80 font-mono text-sm break-all">{aesKey}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-white/50 mb-2 font-mono">AES CIPHERTEXT</p>
                  <p className="text-white/60 font-mono text-xs break-all">{encryptedAES}</p>
                </div>
                <p className="text-xs text-white/60">
                  ✓ Message encrypted with random AES-256 session key
                </p>
              </motion.div>
            )}

            {step === "rsa" && (
              <motion.div
                key="rsa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-black/40 p-4 rounded-lg border border-purple-500/20">
                  <p className="text-xs text-white/50 mb-2 font-mono">RSA-WRAPPED AES KEY</p>
                  <p className="text-white/60 font-mono text-xs break-all">{rsaWrapped}</p>
                </div>
                <p className="text-xs text-white/60 bg-purple-500/10 p-3 rounded-lg">
                  ✓ AES key encrypted with recipient's RSA-2048 public key
                  <br />✓ Only recipient's private key can decrypt this
                </p>
              </motion.div>
            )}

            {step === "bundle" && (
              <motion.div
                key="bundle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-black/40 p-4 rounded-lg border border-amber-500/20">
                  <p className="text-xs text-white/50 mb-2 font-mono">JSON BUNDLE</p>
                  <code className="text-white/60 font-mono text-xs block overflow-auto max-h-40">
                    {JSON.stringify({
                      version: "1.0",
                      algorithm: "AES-256-GCM/RSA-2048-OAEP",
                      wrapped_key: rsaWrapped.slice(0, 30) + "...",
                      ciphertext: encryptedAES,
                      iv: "0x" + "A".repeat(24),
                      tag: "0x" + "B".repeat(32),
                    }, null, 2)}
                  </code>
                </div>
                <button
                  onClick={() => handleCopy(encryptedAES)}
                  className="w-full px-4 py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Copy className={`w-4 h-4 ${copied ? "text-green-400" : ""}`} />
                  {copied ? "Copied!" : "Copy Bundle"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
