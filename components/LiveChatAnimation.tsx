"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Key, Lock, Unlock } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "self" | "other";
  encrypted?: string;
}

const messageFlow: Message[] = [
  {
    id: 1,
    sender: "self",
    text: "Establishing secure handshake...",
    encrypted: "0x8F3A2B1D7C... (RSA Key Exchange)"
  },
  {
    id: 2,
    sender: "other",
    text: "Keys exchanged. AES tunnel initialized. 🔑",
    encrypted: "0x4A9E2D8C1B... (AES Decrypted)"
  },
  {
    id: 3,
    sender: "self",
    text: "Did you review the client security logs?",
    encrypted: "U2FsdGVkX19vR1K5d+A="
  },
  {
    id: 4,
    sender: "other",
    text: "Yes, fully audited. Zero leaks detected. 🔒",
    encrypted: "U2FsdGVkX19sD9F4eB="
  },
  {
    id: 5,
    sender: "self",
    text: "Perfect. CipherChat E2EE is active.",
    encrypted: "U2FsdGVkX19rM3K8hW="
  }
];

export function LiveChatAnimation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [triagedCount, setTriagedCount] = useState(42);
  const [decryptingIds, setDecryptingIds] = useState<number[]>([]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (currentIndex < messageFlow.length) {
      timeout = setTimeout(() => {
        const nextMsg = messageFlow[currentIndex];
        setMessages((prev) => [...prev, nextMsg]);
        setTriagedCount((prev) => prev + 1);
        
        // Trigger decryption animation after 1s for encrypted messages
        if (nextMsg.encrypted) {
          const msgId = nextMsg.id;
          setTimeout(() => {
            setDecryptingIds((prev) => [...prev, msgId]);
          }, 800);
        }

        setCurrentIndex((prev) => prev + 1);
      }, 2000);
    } else {
      // Loop reset
      timeout = setTimeout(() => {
        setMessages([]);
        setDecryptingIds([]);
        setCurrentIndex(0);
        setTriagedCount((prev) => (prev > 100 ? 42 : prev)); // Keep it in a reasonable range
      }, 4000);
    }

    return () => clearTimeout(timeout);
  }, [currentIndex]);

  return (
    <div className="relative w-full h-[400px] lg:h-full bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 flex flex-col overflow-hidden p-6">
      
      {/* Dynamic Background Video Loop for Premium Feel */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <video 
          className="w-full h-full object-cover"
          autoPlay loop muted playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />
      </div>

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Secured Channel
          </span>
        </div>
        <div className="text-xs font-semibold text-white/50 bg-white/5 px-2.5 py-1 rounded-full">
          Today · <span className="text-cyan-400 tabular-nums font-bold">{triagedCount}</span> messages secured
        </div>
      </div>

      {/* Messages Window */}
      <div className="relative z-10 flex-1 overflow-y-auto space-y-4 pr-2 flex flex-col justify-end">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isSelf = msg.sender === "self";
            const isDecrypting = decryptingIds.includes(msg.id);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`flex w-full ${isSelf ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[75%] rounded-2xl p-3.5 relative overflow-hidden transition-all duration-500 ${
                    isSelf 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(37,99,235,0.2)]" 
                      : "bg-white/[0.04] border border-white/10 text-white rounded-tl-none backdrop-blur-md"
                  }`}
                >
                  {/* Encrypted Overlay */}
                  <AnimatePresence>
                    {!isDecrypting && msg.encrypted && (
                      <motion.div 
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-[#0c0c0c]/90 flex items-center gap-2 px-3.5 text-[11px] font-mono text-cyan-400 tracking-tight"
                      >
                        <Lock className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
                        <span className="truncate">{msg.encrypted}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-start gap-2.5">
                    {!isSelf && (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Key className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="text-xs leading-relaxed font-medium">
                        {msg.text}
                      </p>
                      {msg.encrypted && isDecrypting && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                          <Unlock className="w-2.5 h-2.5" /> E2EE Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
