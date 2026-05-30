"use client";

import { Instrument_Serif } from "next/font/google";
import { motion } from "motion/react";

import PlasmaWave from "@/components/ui/PlasmaWave";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      
      {/* Plasma Wave Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <PlasmaWave
          colors={["#8b5cf6", "#38bdf8"]} // Violet to Sky Blue to match the theme
          speed1={0.05}
          speed2={0.05}
          focalLength={0.8}
          bend1={1}
          bend2={0.5}
          dir2={1.0}
          rotationDeg={0}
        />
      </div>

      {/* Glow orb – sky */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute pointer-events-none"
        style={{
          top: "25%", left: "20%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%)",
          filter: "blur(50px)",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Glow orb – violet */}
      <motion.div
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.12, 0.25, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute pointer-events-none"
        style={{
          bottom: "20%", right: "15%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)",
          filter: "blur(50px)",
          transform: "translate(50%, 50%)",
        }}
      />

      {/* Horizontal scanline */}
      <motion.div
        animate={{ y: ["0vh", "100vh"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 pointer-events-none"
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)",
          top: 0,
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-medium tracking-[0.2em] uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Crypto Forensics Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="select-none leading-none mb-6"
        >
          <span
            className="block font-semibold text-transparent bg-clip-text"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 9rem)",
              lineHeight: 1,
              backgroundImage:
                "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 30%, #ffffff 50%, #94a3b8 70%, #e2e8f0 100%)",
              backgroundSize: "200% auto",
              animation: "shimmer 4s linear infinite",
            }}
          >
            CipherScope
          </span>

          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 }}
            className={`block mt-3 text-transparent bg-clip-text ${instrumentSerif.className}`}
            style={{
              fontSize: "clamp(1.8rem, 5vw, 4.5rem)",
              backgroundImage:
                "linear-gradient(135deg, #64748b 0%, #cbd5e1 50%, #64748b 100%)",
            }}
          >
            Crypto Forensics Lab
          </motion.span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
          className="max-w-xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed"
        >
          A professional cryptographic workspace combining hybrid RSA–AES encryption,
          forensic analysis, visualization, and education — all in one secure platform.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs tracking-[0.25em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent"
          />
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </section>
  );
}

export default HeroSection;
