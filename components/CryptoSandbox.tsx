"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, ShieldAlert, Check, Copy, RefreshCw, Cpu } from "lucide-react";

export function CryptoSandbox() {
  const [inputText, setInputText] = useState("Confidential project report ready.");
  const [scrambledText, setScrambledText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [aesKey, setAesKey] = useState("");
  const [rsaWrappedKey, setRsaWrappedKey] = useState("");

  // Generate mock keys once
  useEffect(() => {
    setAesKey(
      Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("").toUpperCase()
    );
    setRsaWrappedKey(
      "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("").toUpperCase()
    );
  }, []);

  // Update cipher text as user types
  useEffect(() => {
    if (!inputText) {
      setScrambledText("");
      return;
    }

    let interval: any;
    let iterations = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    interval = setInterval(() => {
      const result = inputText
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";
          if (index < iterations) {
            // Convert to a pseudo-hash representation
            const charCode = char.charCodeAt(0);
            return chars[(charCode + index) % chars.length];
          }
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");

      setScrambledText(result);

      if (iterations >= inputText.length) {
        clearInterval(interval);
      }
      iterations += 2;
    }, 30);

    return () => clearInterval(interval);
  }, [inputText]);

  const handleCopy = () => {
    const payload = JSON.stringify({
      version: "1.0",
      algorithm: "AES-GCM-256/RSA-OAEP-2048",
      wrapped_key: rsaWrappedKey,
      payload: scrambledText
    }, null, 2);
    navigator.clipboard.writeText(payload);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <section className="w-full py-20 px-6 max-w-5xl mx-auto relative z-20">
      {/* Decorative Blur Header */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center mb-16">
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold bg-cyan-400/10 px-3 py-1 rounded-full">
          Interactive Engine
        </span>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
          Try the Encryption Engine
        </h2>
        <p className="mt-4 text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
          Type a message below to watch CipherChat wrap it in symmetric AES-256 and asymmetric RSA-2048 encryption locally.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-stretch">
        {/* Input Column */}
        <div className="lg:col-span-2 flex flex-col gap-6 justify-between liquid-glass p-6 md:p-8 rounded-2xl border border-white/10">
          <div className="space-y-4">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">
              Plaintext Input (Local Device)
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your secure message here..."
              maxLength={80}
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-cyan-400/50 resize-none transition-colors placeholder:text-white/20"
            />
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Symmetric Key (AES-256)</span>
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="bg-black/35 font-mono text-[11px] p-3 rounded-lg border border-white/5 text-emerald-400 truncate">
              {aesKey || "GENERATE_KEY"}
            </div>

            <div className="flex items-center justify-between text-xs text-white/40 pt-2">
              <span>Asymmetric Wrapped Key (RSA-2048)</span>
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="bg-black/35 font-mono text-[11px] p-3 rounded-lg border border-white/5 text-cyan-400 truncate">
              {rsaWrappedKey || "GENERATE_WRAP"}
            </div>
          </div>
        </div>

        {/* Encrypted Output Column */}
        <div className="lg:col-span-3 liquid-glass p-6 md:p-8 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                E2EE Packet Payload (Ready for server)
              </label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy JSON
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-5 font-mono text-[11px] md:text-xs text-white/80 overflow-y-auto space-y-3 leading-relaxed flex flex-col justify-center">
              <div>
                <span className="text-purple-400">{"{"}</span>
              </div>
              <div className="pl-4">
                <span className="text-white">"version"</span>: <span className="text-emerald-300">"1.0"</span>,
              </div>
              <div className="pl-4">
                <span className="text-white">"algorithm"</span>: <span className="text-emerald-300">"AES-GCM-256/RSA-OAEP-2048"</span>,
              </div>
              <div className="pl-4 flex items-center gap-1.5">
                <span className="text-white">"wrapped_key"</span>: <span className="text-cyan-400 truncate">"{rsaWrappedKey}"</span>
              </div>
              <div className="pl-4 flex items-start gap-1">
                <span className="text-white shrink-0">"payload"</span>: <span className="text-yellow-200 break-all font-semibold">"{scrambledText || "0x00000000"}"</span>
              </div>
              <div>
                <span className="text-purple-400">{"}"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[11px] text-red-300/80 leading-normal">
              Notice: The server routing this message only receives this encrypted blob. The server does not have your private RSA key and can never read the payload.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
