"use client";

import React, { useRef, useState, useEffect } from "react";
import { LandingPage } from "../components/LandingPage";
import { EmailEncryptionDemo } from "../components/EmailEncryptionDemo";
import { MarketingComparison } from "../components/MarketingComparison";
import { FAQSection } from "../components/FAQSection";
import { BlogSection } from "../components/BlogSection";
import { motion, useScroll, useTransform } from "motion/react";

export default function Page() {
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);

  const [heights, setHeights] = useState<number[]>([0, 0, 0, 0]);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const refs = [section1Ref, section2Ref, section3Ref, section4Ref];
    const observers = refs.map((ref, idx) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeights((prev) => {
            const next = [...prev];
            next[idx] = entry.target.scrollHeight;
            return next;
          });
        }
      });
      observer.observe(ref.current);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  const { scrollY } = useScroll();

  // Scroll ranges where each section starts pinning
  const scrollRange0 = Math.max(0, heights[0] - windowHeight);
  const scrollRange1 = Math.max(0, heights[0] + heights[1] - windowHeight);
  const scrollRange2 = Math.max(0, heights[0] + heights[1] + heights[2] - windowHeight);
  const scrollRange3 = Math.max(0, heights[0] + heights[1] + heights[2] + heights[3] - windowHeight);

  // Counter-translations to pin each section when it fills the screen
  const y0 = useTransform(scrollY, (val) => {
    if (val < scrollRange0) return 0;
    return val - scrollRange0;
  });

  const y1 = useTransform(scrollY, (val) => {
    if (val < scrollRange1) return 0;
    return val - scrollRange1;
  });

  const y2 = useTransform(scrollY, (val) => {
    if (val < scrollRange2) return 0;
    return val - scrollRange2;
  });

  const y3 = useTransform(scrollY, (val) => {
    if (val < scrollRange3) return 0;
    return val - scrollRange3;
  });

  // Overlap animations (scale & opacity)
  const overlap0 = useTransform(scrollY, [scrollRange0, scrollRange0 + windowHeight * 0.8], [0, 1]);
  const scale0 = useTransform(overlap0, [0, 1], [1, 0.94]);
  const opacity0 = useTransform(overlap0, [0, 1], [1, 0.6]);

  const overlap1 = useTransform(scrollY, [scrollRange1, scrollRange1 + windowHeight * 0.8], [0, 1]);
  const scale1 = useTransform(overlap1, [0, 1], [1, 0.94]);
  const opacity1 = useTransform(overlap1, [0, 1], [1, 0.6]);

  const overlap2 = useTransform(scrollY, [scrollRange2, scrollRange2 + windowHeight * 0.8], [0, 1]);
  const scale2 = useTransform(overlap2, [0, 1], [1, 0.94]);
  const opacity2 = useTransform(overlap2, [0, 1], [1, 0.6]);

  const overlap3 = useTransform(scrollY, [scrollRange3, scrollRange3 + windowHeight * 0.8], [0, 1]);
  const scale3 = useTransform(overlap3, [0, 1], [1, 0.94]);
  const opacity3 = useTransform(overlap3, [0, 1], [1, 0.6]);

  return (
    <main className="bg-[#0c0c0c] min-h-screen w-full relative overflow-x-hidden">
      {/* 1. LandingPage Card */}
      <motion.div 
        ref={section1Ref}
        style={{ y: y0, scale: scale0, opacity: opacity0 }} 
        className="relative z-10 origin-bottom"
      >
        <LandingPage />
      </motion.div>

      {/* 2. Interactive Email Encryption Demo Card */}
      <motion.div 
        ref={section2Ref}
        style={{ y: y1, scale: scale1, opacity: opacity1 }} 
        className="relative z-20 rounded-t-3xl border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,0.9)] bg-[#0c0c0c] origin-bottom"
      >
        <EmailEncryptionDemo />
      </motion.div>

      {/* 3. Risk Assessment / Comparison Card */}
      <motion.div 
        ref={section3Ref}
        style={{ y: y2, scale: scale2, opacity: opacity2 }} 
        className="relative z-30 rounded-t-3xl border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,0.9)] bg-[#0c0c0c] origin-bottom"
      >
        <MarketingComparison />
      </motion.div>

      {/* 4. FAQ Accordion Card */}
      <motion.div 
        ref={section4Ref}
        style={{ y: y3, scale: scale3, opacity: opacity3 }} 
        className="relative z-40 rounded-t-3xl border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,0.9)] bg-[#0c0c0c] origin-bottom"
      >
        <FAQSection />
      </motion.div>

      {/* 5. Blog Section Card (slides over everything) */}
      <div className="relative z-50">
        <BlogSection />
      </div>
    </main>
  );
}
