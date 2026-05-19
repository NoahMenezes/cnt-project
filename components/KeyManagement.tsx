"use client";

import React, { useState } from "react";
import { Key, Copy, Download, RefreshCw, Shield, Lock } from "lucide-react";
import { motion } from "motion/react";

interface KeyManagementProps {
  userId: string;
}

export function KeyManagement({ userId }: KeyManagementProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockPublicKey = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z3qX2BTLS4e...\n-----END PUBLIC KEY-----";
  const mockFingerprint = "SHA-256: A4F7B2D1E9C3F6A8B1D4E7F0A3C6F9B2D5E8A1C4F7A0D3G6H9I2J5";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-black/40">
        <h2 className="text-2xl font-bold text-white mb-2">Cryptographic Keys</h2>
        <p className="text-sm text-white/60">
          Your RSA-2048 key pair is stored securely in your browser. Your private key never leaves your device.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Security Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Keys Secure & Active</h3>
            <p className="text-sm text-white/70">
              Your RSA-2048 keypair is stored in IndexedDB with encryption. Private key is never transmitted.
            </p>
            <p className="text-xs text-emerald-400 mt-2 font-mono">Status: ✓ Protected</p>
          </div>
        </motion.div>

        {/* User Identity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-glass border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-white">Your Identity</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/50 mb-1">User ID</p>
              <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                <code className="text-sm text-white/80 font-mono">{userId}</code>
                <button
                  onClick={() => handleCopy(userId, "userId")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Copy className={`w-4 h-4 ${copied === "userId" ? "text-emerald-400" : "text-white/60"}`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Public Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="liquid-glass border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Public Key (RSA-2048)</h3>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-white/60">
              Share this with others so they can encrypt messages to you. This key is public and safe to distribute.
            </p>
            <div className="bg-black/40 p-4 rounded-lg overflow-hidden">
              <code className="text-xs text-white/60 font-mono break-all whitespace-pre-wrap">
                {mockPublicKey}
              </code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(mockPublicKey, "publicKey")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-all text-sm"
              >
                <Copy className={`w-4 h-4 ${copied === "publicKey" ? "text-emerald-400" : ""}`} />
                {copied === "publicKey" ? "Copied!" : "Copy Key"}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-all text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Key Fingerprint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="liquid-glass border border-cyan-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-white">Key Fingerprint</h3>
          </div>
          <p className="text-xs text-white/60 mb-3">
            A short representation of your public key. Share this for verification.
          </p>
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg mb-3">
            <code className="text-sm text-white/80 font-mono">{mockFingerprint}</code>
            <button
              onClick={() => handleCopy(mockFingerprint, "fingerprint")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Copy className={`w-4 h-4 ${copied === "fingerprint" ? "text-emerald-400" : "text-white/60"}`} />
            </button>
          </div>
        </motion.div>

        {/* Regenerate Keys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="liquid-glass border border-yellow-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-white">Regenerate Keys</h3>
          </div>
          <p className="text-xs text-white/60 mb-4">
            Generate a new RSA-2048 keypair. This will invalidate your previous key and you'll need to share the new public key.
          </p>
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="w-full px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 disabled:opacity-50 text-yellow-400 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Generate New Keypair
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
