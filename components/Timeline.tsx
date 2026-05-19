"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { UserCheck, KeyRound, ShieldCheck, MessageSquare, Database } from "lucide-react";

interface TimelineItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const timelineData: TimelineItem[] = [
  {
    id: 1,
    title: "User Authentication",
    subtitle: "Clerk-Powered Identity",
    description: "Multi-tenant verification ensures only registered and authenticated users can establish secure endpoints and exchange keys.",
    icon: UserCheck,
    color: "#3b82f6" // Blue
  },
  {
    id: 2,
    title: "RSA Key Generation",
    subtitle: "Asymmetric Key Pair Exchange",
    description: "Every user generates a unique 2048-bit RSA key pair. Public keys are registered on the server for encryption, while private keys remain securely on the user device.",
    icon: KeyRound,
    color: "#a855f7" // Purple
  },
  {
    id: 3,
    title: "AES Payload Encryption",
    subtitle: "Symmetric Speed + Security",
    description: "Messages are encrypted locally using AES-256 for maximum speed. The AES key is then encrypted with the recipient's RSA public key (Hybrid Encryption).",
    icon: ShieldCheck,
    color: "#10b981" // Emerald
  },
  {
    id: 4,
    title: "Real-time Messaging",
    subtitle: "Instant Encrypted Transit",
    description: "Encrypted payloads are dispatched instantly via WebSocket connections, ensuring sub-100ms real-time chat latency without decrypting data server-side.",
    icon: MessageSquare,
    color: "#06b6d4" // Cyan
  },
  {
    id: 5,
    title: "Secure History Storage",
    subtitle: "Zero-Knowledge Database",
    description: "Encrypted history is stored safely. Even if the database is compromised, messages remain unreadable since private decryption keys never leave the client.",
    icon: Database,
    color: "#f59e0b" // Amber
  }
];

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative max-w-5xl mx-auto px-6 py-32 w-full flex flex-col items-center">
      
      {/* Background Decorative Radial Gradient */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_60%)]" />

      {/* Header */}
      <div className="text-center mb-24">
        <span className="text-xs uppercase tracking-widest text-[#00d2ff] font-semibold bg-[#00d2ff]/10 px-3 py-1 rounded-full">
          Architecture Flow
        </span>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
          How CipherChat Secures Messages
        </h2>
        <p className="mt-4 text-white/50 max-w-md mx-auto text-sm leading-relaxed">
          From authentication to decryption, track the lifecycle of a secure message through our hybrid cryptographic pipeline.
        </p>
      </div>

      {/* Timeline wrapper */}
      <div className="relative w-full">
        
        {/* Central vertical line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-white/10 hidden md:block" />
        
        {/* Animated growing line */}
        <motion.div 
          style={{ height: lineHeight }} 
          className="absolute left-1/2 -translate-x-1/2 top-0 w-0.5 bg-gradient-to-b from-[#00d2ff] via-[#a855f7] to-[#f59e0b] shadow-[0_0_15px_rgba(0,210,255,0.5)] origin-top hidden md:block"
        />

        {/* Mobile vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10 md:hidden" />
        <motion.div 
          style={{ height: lineHeight }} 
          className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-[#00d2ff] via-[#a855f7] to-[#f59e0b] shadow-[0_0_15px_rgba(0,210,255,0.5)] origin-top md:hidden"
        />

        {/* Timeline Cards */}
        <div className="space-y-20">
          {timelineData.map((item, idx) => {
            const Icon = item.icon;
            const isEven = idx % 2 === 0;

            return (
              <div 
                key={item.id}
                className="relative flex flex-col md:flex-row items-start md:items-center justify-between w-full"
              >
                {/* Node Dot */}
                <div 
                  className="absolute left-6 md:left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full border bg-[#0c0c0c] transition-all duration-300 group shadow-lg"
                  style={{ borderColor: item.color }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>

                {/* Left empty container / Right content card for Desktop */}
                <div className={`w-full md:w-[45%] pl-16 md:pl-0 ${isEven ? "md:order-1 md:text-right" : "md:order-3 md:text-left"}`}>
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="liquid-glass rounded-2xl p-6 md:p-8 hover:border-white/20 transition-colors"
                  >
                    {/* Glowing highlight */}
                    <div 
                      className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" 
                      style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }}
                    />
                    
                    <span 
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: item.color }}
                    >
                      Step {item.id} · {item.subtitle}
                    </span>
                    
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
                      {item.title}
                    </h3>
                    
                    <p className="mt-3 text-sm text-white/60 leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                </div>

                {/* Spacer block for desktop layout alignment */}
                <div className={`hidden md:block w-[45%] ${isEven ? "md:order-3" : "md:order-1"}`} />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
