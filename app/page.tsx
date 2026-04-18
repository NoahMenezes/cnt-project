"use client";

import Link from "next/link";
import { Shield, Lock, Share2, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Show, SignInButton } from "@clerk/nextjs";

export default function Home() {
  const features = [
    {
      icon: <Shield className="w-6 h-6 text-indigo-400" />,
      title: "End-to-End Encrypted",
      desc: "AES-256 and RSA-OAEP ensure your data is never seen by our servers.",
    },
    {
      icon: <Lock className="w-6 h-6 text-purple-400" />,
      title: "Hybrid Encryption",
      desc: "Fast AES for content, secure RSA for session keys. Best of both worlds.",
    },
    {
      icon: <EyeOff className="w-6 h-6 text-pink-400" />,
      title: "Zero-Knowledge",
      desc: "We store metadata, but your plaintext remains in the browser only.",
    },
    {
      icon: <Share2 className="w-6 h-6 text-cyan-400" />,
      title: "Secure Sharing",
      desc: "Share files and messages via public key encryption. No passwords shared.",
    },
  ];

  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <section className="container mx-auto px-6 relative z-10 text-center space-y-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Production Ready Encryption
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
            Securely Share Everything, <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Compromise Nothing.
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            The world&apos;s first hybrid-encrypted sharing platform. Client-side RSA + AES ensures
            total privacy. Your code, your files, your messages—secured.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
            >
              Go to Dashboard
            </Link>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
                Start Encrypting Now
              </button>
            </SignInButton>
          </Show>
          <Link
            href="https://github.com/noah/secureshare"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold backdrop-blur-md transition-all hover:scale-105"
          >
            How it works
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left mt-24">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 3), duration: 0.5 }}
              className="p-6 rounded-3xl glass-dark hover:bg-white/[0.07] transition-all border border-white/[0.05]"
            >
              <div className="mb-4 p-3 rounded-2xl bg-white/5 inline-block border border-white/5">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Decorative Mockup */}
      <section className="mt-32 relative text-center">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="relative p-2 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[3/1.2] glass flex items-center justify-center group">
            <div className="text-slate-500 font-mono text-sm group-hover:text-slate-300 transition-colors">
              {"// Generating AES-GCM 256-bit key..."} <br />
              {"// Public key found for recipient 'Alice'..."} <br />
              {"// Wrapping AES with RSA-OAEP..."} <br />
              {"// Encrypting payload..."} <br />
              <span className="text-indigo-400 font-bold">READY TO TRANSMIT</span>
            </div>
            {/* Animating glow inside mockup */}
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 top-1/2 -translate-y-1/2 animate-pulse scale-x-150 rotate-12 pointer-events-none" />
          </div>
        </div>
      </section>
    </div>
  );
}
