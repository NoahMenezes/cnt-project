"use client";

import React, { useState } from "react";
import { ArrowLeft, Lock, Download, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { EmailItem } from "./Inbox";

interface EmailViewerProps {
  email: EmailItem | null;
  onBack: () => void;
}

export function EmailViewer({ email, onBack }: EmailViewerProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [showCiphertext, setShowCiphertext] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-white/40">
        <p>Select an email to read</p>
      </div>
    );
  }

  const handleDecrypt = () => {
    setIsDecrypting(true);
    // Simulate decryption with RSA + AES
    setTimeout(() => {
      setIsDecrypted(true);
      setIsDecrypting(false);
    }, 1500);
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText("SHA-256: A4F7B2D1...");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock decrypted content
  const emailBody = "This is the decrypted email content. The message was protected with AES-256-GCM encryption and the AES key was encrypted using RSA-2048-OAEP with the recipient's public key. Only you can decrypt this message with your private key.";
  const ciphertext = "U2FsdGVkX19vR1K5d+A5K7X0B8ZmP2L9N3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col bg-gradient-to-br from-black/40 via-black/30 to-black/40"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{email.subject}</h2>
            <p className="text-sm text-white/60">From: {email.from}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>RSA-2048 Encrypted</span>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!isDecrypted ? (
          <>
            {/* Encrypted Notice */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="liquid-glass border border-cyan-500/30 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Email Encrypted with Hybrid Cryptography
              </h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                This email is encrypted with AES-256-GCM for the message body and RSA-2048-OAEP for the encryption key. Only you can decrypt it using your private key.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-white/50 mb-1">Cipher Algorithm</p>
                  <p className="font-semibold text-white">AES-256-GCM</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-white/50 mb-1">Key Exchange</p>
                  <p className="font-semibold text-white">RSA-2048-OAEP</p>
                </div>
              </div>

              <button
                onClick={handleDecrypt}
                disabled={isDecrypting}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center gap-2 mx-auto"
              >
                {isDecrypting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Decrypt with Private Key
                  </>
                )}
              </button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Decrypted Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="liquid-glass border border-emerald-500/30 rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2 }}
                  >
                    <Lock className="w-5 h-5" />
                  </motion.div>
                  <span className="text-sm font-semibold">Successfully Decrypted</span>
                </div>
                <button
                  onClick={() => setShowCiphertext(!showCiphertext)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {showCiphertext ? (
                    <EyeOff className="w-4 h-4 text-white/60" />
                  ) : (
                    <Eye className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>

              {/* Plaintext */}
              <p className="text-white/80 leading-relaxed mb-6">
                {emailBody}
              </p>

              {/* Sender Info */}
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 mb-1">Sender Fingerprint</p>
                    <p className="text-sm text-white/70 font-mono">SHA-256: A4F7B2D1...</p>
                  </div>
                  <button
                    onClick={handleCopyFingerprint}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Decryption Time</p>
                  <p className="text-sm text-white/70">1.2 seconds (RSA + AES)</p>
                </div>
              </div>
            </motion.div>

            {/* Show Ciphertext */}
            {showCiphertext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="liquid-glass border border-white/10 rounded-2xl p-6"
              >
                <p className="text-xs text-white/50 mb-3 font-semibold uppercase">
                  Encrypted Ciphertext (Reference)
                </p>
                <div className="bg-black/50 p-4 rounded-lg overflow-x-auto">
                  <code className="text-xs text-white/40 font-mono break-all">
                    {ciphertext}
                  </code>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/10 bg-black/40 flex items-center gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-all">
          <Download className="w-4 h-4" />
          Download
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-all">
          <Download className="w-4 h-4" />
          Save Attachment
        </button>
        <button className="px-4 py-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
