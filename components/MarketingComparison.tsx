"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Server, Lock, HelpCircle } from "lucide-react";

export function MarketingComparison() {
  return (
    <section className="w-full py-20 px-6 max-w-5xl mx-auto relative z-20">
      <div className="text-center mb-16">
        <span className="text-xs uppercase tracking-widest text-[#a855f7] font-semibold bg-[#a855f7]/10 px-3 py-1 rounded-full">
          Risk Assessment
        </span>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
          Why Standard Chat Fails
        </h2>
        <p className="mt-4 text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
          Traditional messaging networks rely on server-side security. When servers are breached, your private conversations are exposed.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Vulnerable Standard Apps Card */}
        <div className="liquid-glass border border-red-500/10 hover:border-red-500/20 rounded-2xl p-8 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] pointer-events-none rounded-full" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Standard Servers</h3>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">Vulnerable</p>
            </div>
          </div>

          <ul className="space-y-4 text-sm text-white/60">
            {[
              "Plaintext storage exposes database contents upon breach.",
              "Database backups are readable by hosts and server maintainers.",
              "Third-party server keys can be seized or intercepted.",
              "Compromised relays allow passive wiretapping and metadata exploits."
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-red-400/80 shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CipherChat Secured Card */}
        <div className="liquid-glass border border-emerald-500/10 hover:border-emerald-500/20 rounded-2xl p-8 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] pointer-events-none rounded-full" />

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">CipherChat</h3>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Zero-Trust Secured</p>
            </div>
          </div>

          <ul className="space-y-4 text-sm text-white/60">
            {[
              "Messages are sealed locally using AES-256 before leaving your client.",
              "No plaintext ever touches our databases; leaks yield only random cipher text.",
              "Private RSA-2048 keys are held locally in secure sandbox storage.",
              "Hybrid handshake generates dynamic key pairs for every chat session."
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
