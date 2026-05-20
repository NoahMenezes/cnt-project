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
      className="w-full h-full flex flex-col bg-[#08090a]"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-[#23252a] flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <motion.button
            onClick={onBack}
            whileHover={{ backgroundColor: "#0f1011" }}
            className="p-2 hover:bg-[#0f1011] rounded-md transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#f7f8f8]" strokeWidth={2} />
          </motion.button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-[#f7f8f8] truncate" style={{ letterSpacing: "-0.12px" }}>
              {email.subject}
            </h2>
            <p className="text-xs sm:text-sm text-[#8a8f98] truncate">From: {email.from}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#8a8f98] text-xs shrink-0">
          <Lock className="w-4 h-4 text-[#e4f222]" strokeWidth={2} />
          <span className="hidden sm:inline">RSA-2048 Encrypted</span>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {!isDecrypted ? (
          <>
            {/* Encrypted Notice */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-md border border-[#23252a] bg-[#0f1011] p-6 sm:p-8 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Email Encrypted with Hybrid Cryptography
              </h3>
              <p className="text-[#8a8f98] mb-6 max-w-md mx-auto">
                This email is encrypted with AES-256-GCM for the message body and RSA-2048-OAEP for the encryption key. Only you can decrypt it using your private key.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-[#0f1011] border border-[#23252a] rounded-md p-4">
                  <p className="text-xs text-[#8a8f98] mb-1">Cipher Algorithm</p>
                  <p className="font-semibold text-[#f7f8f8]">AES-256-GCM</p>
                </div>
                <div className="bg-[#0f1011] border border-[#23252a] rounded-md p-4">
                  <p className="text-xs text-[#8a8f98] mb-1">Key Exchange</p>
                  <p className="font-semibold text-[#f7f8f8]">RSA-2048-OAEP</p>
                </div>
              </div>

              <motion.button
                onClick={handleDecrypt}
                disabled={isDecrypting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-[#e4f222] hover:bg-[#f0ff33] disabled:opacity-50 text-[#08090a] font-semibold rounded-md transition-all flex items-center gap-2 mx-auto"
              >
                {isDecrypting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#08090a]/30 border-t-[#08090a] rounded-full animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" strokeWidth={2} />
                    Decrypt with Private Key
                  </>
                )}
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Decrypted Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-[#23252a] bg-[#0f1011] p-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#e4f222]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2 }}
                  >
                    <Lock className="w-5 h-5" strokeWidth={2} />
                  </motion.div>
                  <span className="text-sm font-semibold">Successfully Decrypted</span>
                </div>
                <motion.button
                  onClick={() => setShowCiphertext(!showCiphertext)}
                  whileHover={{ backgroundColor: "#161718" }}
                  className="p-2 hover:bg-[#161718] rounded-md transition-colors"
                >
                  {showCiphertext ? (
                    <EyeOff className="w-4 h-4 text-[#8a8f98]" strokeWidth={2} />
                  ) : (
                    <Eye className="w-4 h-4 text-[#8a8f98]" strokeWidth={2} />
                  )}
                </motion.button>
              </div>

              {/* Plaintext */}
              <p className="text-[#d0d6e0] leading-relaxed mb-6">
                {emailBody}
              </p>

              {/* Sender Info */}
              <div className="mt-8 pt-6 border-t border-[#23252a] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8a8f98] mb-1">Sender Fingerprint</p>
                    <p className="text-sm text-[#d0d6e0] font-mono">SHA-256: A4F7B2D1...</p>
                  </div>
                  <motion.button
                    onClick={handleCopyFingerprint}
                    whileHover={{ backgroundColor: "#161718" }}
                    className="p-2 hover:bg-[#161718] rounded-md transition-colors"
                  >
                    <Copy className="w-4 h-4 text-[#e4f222]" strokeWidth={2} />
                  </motion.button>
                </div>
                <div>
                  <p className="text-xs text-[#8a8f98] mb-1">Decryption Time</p>
                  <p className="text-sm text-[#d0d6e0]">1.2 seconds (RSA + AES)</p>
                </div>
              </div>
            </motion.div>

            {/* Show Ciphertext */}
            {showCiphertext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-md border border-[#23252a] bg-[#0f1011] p-6"
              >
                <p className="text-xs text-[#8a8f98] mb-3 font-semibold uppercase tracking-wider">
                  Encrypted Ciphertext (Reference)
                </p>
                <div className="bg-[#08090a] p-4 rounded-md overflow-x-auto">
                  <code className="text-xs text-[#62666d] font-mono break-all">
                    {ciphertext}
                  </code>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-[#23252a] bg-[#08090a] flex items-center gap-3">
        <motion.button
          whileHover={{ backgroundColor: "#161718" }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0f1011] border border-[#23252a] hover:bg-[#161718] text-[#f7f8f8] rounded-md transition-all"
        >
          <Download className="w-4 h-4" strokeWidth={2} />
          Download
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: "#161718" }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0f1011] border border-[#23252a] hover:bg-[#161718] text-[#f7f8f8] rounded-md transition-all"
        >
          <Download className="w-4 h-4" strokeWidth={2} />
          Save Attachment
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: "#eb5757" }}
          className="px-4 py-3 bg-transparent border border-[#eb5757] border-opacity-30 hover:bg-[#eb5757]/10 text-[#eb5757] rounded-md transition-all"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2} />
        </motion.button>
      </div>
    </motion.div>
  );
}
