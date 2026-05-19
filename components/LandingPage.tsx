"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ChevronRight, Menu } from "lucide-react";
import { LogoMark, AppleButton, SectionEyebrow } from "./SharedPrimitives";
import dynamic from "next/dynamic";

const IphoneCanvas = dynamic(
  () => import("./IphoneCanvas").then((mod) => mod.IphoneCanvas),
  { ssr: false }
);

export function LandingPage() {
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: zoomContainerRef,
    offset: ["start end", "end end"]
  });

  // Fade out the canvas at the very end of the scroll (0.8 to 1)
  const canvasOpacity = useTransform(scrollYProgress, [0.8, 1], [1, 0]);
  // Fade in the real website content when the canvas fades out
  const websiteOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 1]);

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
        {/* Section 1 — Navbar */}
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between"
        >
          <div className="flex items-center">
            <LogoMark />
          </div>
          
          <div className="hidden md:flex gap-8 items-center">
            {['Solutions','Pricing','Blog','Documentation','Careers'].map((item, i) => (
              <motion.a 
                key={item}
                href="#"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="hidden md:block">
            <AppleButton />
          </div>
          <div className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5">
            <Menu className="w-5 h-5 text-white" />
          </div>
        </motion.nav>

        {/* Section 2 — Hero */}
        <section className="pt-24 md:pt-40 pb-20 text-center flex flex-col items-center px-6">
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
        </section>

        {/* Section 4 — iPhone 3D Zoom Showcase */}
        <section ref={zoomContainerRef} className="relative h-[300vh] w-full z-20">
          <motion.div style={{ opacity: canvasOpacity }} className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
            <IphoneCanvas progress={scrollYProgress} />
          </motion.div>
        </section>

        {/* Real Website Content (Revealed through the phone) */}
        <motion.div style={{ opacity: websiteOpacity }} className="relative z-30 bg-[#0c0c0c] flex flex-col items-center">

        {/* Section 5 — FeatureTriage */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 w-full">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <SectionEyebrow label="Triage" tag="AI-native" />
              <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
                Clear your inbox <br /> in a single pass.
              </h2>
              <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
                Aura reads every message, understands intent, and routes the noise away from the signal. Focus on what moves your day forward — the rest handles itself.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-2">
                {['Auto-categorize', 'Snooze for later', 'Silent newsletters', 'One-tap unsubscribe'].map(chip => (
                  <span key={chip} className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="liquid-glass rounded-2xl p-5"
            >
              <div className="text-xs font-semibold text-white/50 mb-5">Today · 42 messages triaged</div>
              
              <div className="space-y-3">
                {[
                  { title: 'Priority', count: 4, color: '#ffffff', items: ['Sophia Chen — Q3 review', 'David Lim — contract signoff'] },
                  { title: 'Follow-up', count: 7, color: '#e5e5e5', items: ['Marcus — design review', 'Figma — comment thread'] },
                  { title: 'Updates', count: 18, color: '#a3a3a3', items: ['Vercel — deploy ready', 'GitHub — PR #482 merged'] },
                  { title: 'Archived', count: 13, color: '#525252', items: ['Stripe payout · Newsletter · Receipts'] },
                ].map((group) => (
                  <div key={group.title} className="liquid-glass rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.color }}></div>
                        <span className="text-sm font-semibold" style={{ color: group.color }}>{group.title}</span>
                      </div>
                      <span className="text-xs text-white/40">{group.count}</span>
                    </div>
                    <div className="pl-3.5 space-y-2">
                      {group.items.map((item, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, y: 15, scale: 0.9 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true, margin: "-20px" }}
                          transition={{ 
                            duration: 0.5, 
                            delay: 0.4 + (idx * 0.15), 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 20 
                          }}
                          className="text-xs text-white/80 truncate bg-white/5 px-3 py-2 rounded-md border border-white/10 shadow-lg"
                        >
                          {item}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>


        {/* Section 9 — FinalCTA */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
          >
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)',
                opacity: 0.3
              }}
            ></div>
            
            <h2 className="relative z-10 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
              Close the tabs.<br />Open your day.
            </h2>
            <p className="relative z-10 mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
              Join thousands of builders, founders, and operators who treat email like a tool — not an obligation.
            </p>
            
            <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <AppleButton />
              <button className="flex items-center justify-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors">
                Talk to sales
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Footer padding */}
        <div className="h-12 w-full"></div>
        </motion.div>
      </div>
    </div>
  );
}
