"use client";

import React from "react";
import { motion } from "motion/react";
import { ChevronRight, Menu } from "lucide-react";
import { LogoMark, AppleButton, SectionEyebrow } from "./SharedPrimitives";
import { Timeline } from "./Timeline";
import { LiveChatAnimation } from "./LiveChatAnimation";
import dynamic from "next/dynamic";

// Temporarily deactivated 3D Canvas
// const IphoneCanvas = dynamic(
//   () => import("./IphoneCanvas").then((mod) => mod.IphoneCanvas),
//   { ssr: false }
// );

export function LandingPage() {

  return (
    <div className="relative min-h-screen bg-[#0c0c0c] text-white overflow-hidden">
      {/* Global background video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay loop muted playsInline
          className="w-full h-full object-cover pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4" />
      </div>



      {/* Root SVG Noise Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Section 2 — Hero */}
        <section className="pt-24 md:pt-40 pb-28 text-center flex flex-col items-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 text-white rounded-full text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Zero-Trust Encryption Active
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-9xl lg:text-[180px] font-bold tracking-tighter leading-none"
          >
            <span 
              className="animate-shiny"
              style={{
                backgroundImage: 'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                filter: 'url(#c3-noise)'
              }}
            >
              CipherText
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-white/60 text-lg md:text-xl font-medium max-w-2xl leading-relaxed"
          >
            A secure real-time messaging application designed with hybrid cryptography. 
            Your messages are sealed locally using AES-256 and RSA-2048 before transmission. 
            No key, no access. Not even our servers can read them.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-wrap gap-4 justify-center"
          >
            <button className="bg-white text-black rounded-full px-8 py-4 text-sm font-semibold hover:scale-[1.03] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer">
              Launch Secure App
            </button>
            <button className="flex items-center justify-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-8 py-4 hover:bg-white/5 transition-all cursor-pointer">
              View cryptographic specs
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </section>

        {/* Timeline Flow Section (Replacing 3D Model Gap) */}
        <Timeline />

        {/* Real Website Content */}
        <div className="relative z-30 bg-[#0c0c0c] flex flex-col items-center">

        {/* Section 5 — Features (Structured like BlogSection) */}
        <section className="w-full bg-[#0c0c0c] text-white py-[80px] px-5 relative z-20 border-t border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div className="max-w-2xl">
                <div className="inline-block px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-semibold uppercase tracking-wider mb-4">
                  Features
                </div>
                <h2 className="font-outfit font-medium text-[48px] md:text-[64px] tracking-[-2.5px] leading-none mb-6">
                  Zero-Trust Architecture
                </h2>
                <p className="text-white/60 text-lg font-medium opacity-80 max-w-[480px] leading-[1.6]">
                  Every message is sealed locally. We leverage advanced hybrid cryptography to guarantee your conversational privacy.
                </p>
              </div>
              <button className="bg-white text-black rounded-full px-6 py-3 text-sm font-semibold hover:scale-[1.02] transition-transform self-start md:self-end shrink-0">
                View Cryptographic Specs
              </button>
            </div>

            {/* Featured Feature */}
            <div className="group border border-white/10 rounded-[20px] bg-[#0e1014] overflow-hidden grid lg:grid-cols-2 min-h-[520px] mb-[25px]">
              <div className="relative h-[400px] lg:h-auto overflow-hidden">
                <LiveChatAnimation />
                {/* Brackets */}
                <div className="absolute top-[15px] left-[15px] w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-white/20"></div>
                <div className="absolute top-[15px] right-[15px] w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-white/20"></div>
                <div className="absolute bottom-[15px] left-[15px] w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-white/20"></div>
                <div className="absolute bottom-[15px] right-[15px] w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-white/20"></div>
              </div>
              
              <div className="p-10 lg:p-[60px] flex flex-col items-start h-full">
                <span className="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
                  Core Cryptography
                </span>
                <h3 className="font-outfit font-medium text-[32px] md:text-[48px] tracking-[-1.5px] leading-tight mb-4">
                  Hybrid RSA + AES Exchange
                </h3>
                <p className="text-white/60 text-[17px] leading-relaxed mb-8">
                  By combining the lightning-fast speed of AES-256 symmetric encryption with the bulletproof security of RSA-2048 asymmetric encryption, CipherText builds a transient secure tunnel for every transmission. No permanent master keys exist.
                </p>
                <div className="mt-auto w-full flex items-center justify-between pt-6 border-t border-white/10">
                  <span className="text-sm text-white/60 font-medium">By CipherText Cryptography Team</span>
                  <span className="px-3 py-1 rounded-full text-white text-[11px] font-semibold uppercase tracking-wide bg-[#7d1a4a]">
                    HYBRID CRYPTO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Footer padding */}
        <div className="h-12 w-full"></div>
        </div>
      </div>
    </div>
  );
}
