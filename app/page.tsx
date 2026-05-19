"use client";

import React, { useRef, useState, useEffect } from "react";
import { LandingPage } from "../components/LandingPage";
import { BlogSection } from "../components/BlogSection";
import { CryptoSandbox } from "../components/CryptoSandbox";
import { MarketingComparison } from "../components/MarketingComparison";
import { FAQSection } from "../components/FAQSection";
import { motion, useScroll, useTransform } from "motion/react";

interface ScrollPinnedSectionProps {
  children: React.ReactNode;
  zIndex: number;
}

function ScrollPinnedSection({ children, zIndex }: ScrollPinnedSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.target.scrollHeight);
      }
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  // Track scroll progress of this section's scroll range
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Track the overlap progress as the next section scrolls up over this one
  const { scrollYProgress: overlapProgress } = useScroll({
    target: containerRef,
    offset: ["end end", "end start"]
  });

  const scrollRange = Math.max(0, contentHeight - windowHeight);
  
  // Translate content upward as user scrolls through the wrapper
  const y = useTransform(scrollYProgress, [0, 1], [0, -scrollRange]);

  // Scale and opacity transformations as the next section overlaps this one
  const scale = useTransform(overlapProgress, [0, 0.8], [1, 0.94]);
  const opacity = useTransform(overlapProgress, [0, 0.8], [1, 0.6]);

  return (
    <div 
      ref={containerRef} 
      style={{ height: contentHeight ? `${contentHeight}px` : "auto" }}
      className="relative w-full"
    >
      <div 
        style={{ zIndex }}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#0c0c0c]"
      >
        <motion.div 
          ref={contentRef} 
          style={{ y, scale, opacity }} 
          className="w-full origin-bottom"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="bg-[#0c0c0c] min-h-screen w-full relative overflow-x-hidden">
      {/* 1. Landing Page (Hero, Timeline, Features) */}
      <ScrollPinnedSection zIndex={10}>
        <LandingPage />
      </ScrollPinnedSection>

      {/* 2. Interactive Engine (Crypto Sandbox) */}
      <ScrollPinnedSection zIndex={20}>
        <div className="bg-[#0c0c0c] border-t border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          <CryptoSandbox />
        </div>
      </ScrollPinnedSection>

      {/* 3. Risk Assessment & FAQ */}
      <ScrollPinnedSection zIndex={30}>
        <div className="bg-[#0c0c0c] border-t border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-12">
          <MarketingComparison />
          <FAQSection />
        </div>
      </ScrollPinnedSection>

      {/* 4. Blog Section */}
      <ScrollPinnedSection zIndex={40}>
        <div className="bg-[#0c0c0c] border-t border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          <BlogSection />
        </div>
      </ScrollPinnedSection>
    </main>
  );
}
