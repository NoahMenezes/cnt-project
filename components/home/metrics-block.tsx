"use client";

import { motion, type Variants } from "framer-motion";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { FlaskConical, FileSearch, Key, FileDown, ArrowUpRight } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

const PhoneModel = dynamic(() => import("@/components/ui/phone-model"), { ssr: false });

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const getBeamColors = (accent: string) => {
  if (accent.includes("sky")) return { from: "#38bdf8", to: "#818cf8" };
  if (accent.includes("violet")) return { from: "#a78bfa", to: "#c084fc" };
  if (accent.includes("amber")) return { from: "#fbbf24", to: "#f59e0b" };
  if (accent.includes("emerald")) return { from: "#34d399", to: "#10b981" };
  return { from: "#38bdf8", to: "#818cf8" };
};

const infoCards = [
  {
    title: "Interactive Hybrid Lab",
    description: "Explore cryptographic workflows in real-time. Generate public/private keys, encrypt payloads, transmit securely, and log modular arithmetic details.",
    icon: FlaskConical,
    accent: "from-sky-500/10 to-transparent",
    iconColor: "text-sky-400",
  },
  {
    title: "Entropy & Audit Engine",
    description: "Analyze uploaded documents to calculate Shannon entropy, identify repeated byte ciphers, and flag deprecated RSA public modulus sizes.",
    icon: FileSearch,
    accent: "from-violet-500/10 to-transparent",
    iconColor: "text-violet-400",
  },
  {
    title: "Secure Key Vault",
    description: "Inspect and manage your active AES session keys and RSA pairs. Securely browse stored keys and their corresponding encryption context.",
    icon: Key,
    accent: "from-amber-500/10 to-transparent",
    iconColor: "text-amber-400",
  },
  {
    title: "Forensic Reporting",
    description: "Download comprehensive security audit reports in JSON or print-ready PDF formats. Summarize entropy scores and recommendations instantly.",
    icon: FileDown,
    accent: "from-emerald-500/10 to-transparent",
    iconColor: "text-emerald-400",
  },
];

export function GlassmorphismMinimalMetricsBlock() {
  return (
    <section className="relative overflow-hidden px-6 pt-12 lg:pt-16 pb-0 flex flex-col items-center justify-center">
      {/* Background glow orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-foreground/[0.02] blur-[120px] opacity-40" />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ staggerChildren: 0.08 }}
          className="grid gap-8 grid-cols-1 lg:grid-cols-3 items-center py-10"
        >
          {/* Left Column - Information Cards */}
          <div className="space-y-6 flex flex-col justify-center order-2 lg:order-1">
            {infoCards.slice(0, 2).map((card) => {
              const Icon = card.icon;
              const colors = getBeamColors(card.accent);
              return (
                <motion.div key={card.title} variants={fadeUp}>
                  <Card className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01] p-8 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.02]">
                    <BorderBeam
                      size={150}
                      duration={8}
                      colorFrom={colors.from}
                      colorTo={colors.to}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center ${card.iconColor}`}>
                          <Icon size={18} />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-white/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/60" />
                      </div>
                      <h3 className="text-white font-semibold text-lg">{card.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Center Column - 3D Phone Model */}
          <motion.div
            variants={fadeUp}
            className="relative h-[600px] w-full flex items-center justify-center order-1 lg:order-2"
          >
            <div className="absolute inset-0 rounded-[4rem] bg-gradient-to-b from-primary/5 to-transparent blur-3xl -z-10" />
            <PhoneModel />
          </motion.div>

          {/* Right Column - Information Cards */}
          <div className="space-y-6 flex flex-col justify-center order-3">
            {infoCards.slice(2, 4).map((card) => {
              const Icon = card.icon;
              const colors = getBeamColors(card.accent);
              return (
                <motion.div key={card.title} variants={fadeUp}>
                  <Card className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01] p-8 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.02]">
                    <BorderBeam
                      size={150}
                      duration={8}
                      colorFrom={colors.from}
                      colorTo={colors.to}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center ${card.iconColor}`}>
                          <Icon size={18} />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-white/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/60" />
                      </div>
                      <h3 className="text-white font-semibold text-lg">{card.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
