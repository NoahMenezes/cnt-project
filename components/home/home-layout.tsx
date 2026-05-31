"use client";

import HeroSection from "@/components/home/hero-section";
import type { NavigationSection } from "@/components/layout/header";
import Header from "@/components/layout/header";
import { GlassmorphismMinimalMetricsBlock } from "@/components/home/metrics-block";
import { motion, type Variants } from "motion/react";
import Link from "next/link";
import {
  Lock, FileSearch, FlaskConical, BarChart3,
  BookOpen, Key, Layers,
  ArrowRight, CheckCircle, Upload,
  Cpu, Download,
} from "lucide-react";

import { BorderBeam } from "@/components/ui/border-beam";

// ─── Shared fade-up variant ───────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const getBeamColors = (accent: string) => {
  if (accent.includes("sky")) return { from: "#38bdf8", to: "#818cf8" };
  if (accent.includes("violet")) return { from: "#a78bfa", to: "#c084fc" };
  if (accent.includes("emerald")) return { from: "#34d399", to: "#10b981" };
  if (accent.includes("amber")) return { from: "#fbbf24", to: "#f59e0b" };
  if (accent.includes("rose")) return { from: "#f43f5e", to: "#fda4af" };
  if (accent.includes("cyan")) return { from: "#06b6d4", to: "#22d3ee" };
  return { from: "#38bdf8", to: "#818cf8" };
};

// ─── Feature Cards ────────────────────────────────────────────
const features = [
  {
    icon: Lock,
    title: "Hybrid RSA–AES Encryption",
    description:
      "Upload files and encrypt them using AES for speed, while RSA secures the session key. Produces portable, downloadable encrypted bundles.",
    accent: "from-sky-500/20 to-sky-500/0",
    iconColor: "text-sky-400",
    href: "/hybrid-lab",
  },
  {
    icon: FileSearch,
    title: "Cryptographic Analysis",
    description:
      "Evaluate entropy, detect repeated byte patterns, flag weak RSA moduli, and score encryption quality across every analyzed document.",
    accent: "from-violet-500/20 to-violet-500/0",
    iconColor: "text-violet-400",
    href: "/analyze",
  },
  {
    icon: BarChart3,
    title: "Forensic Reporting",
    description:
      "Generate detailed PDF/JSON reports with findings, recommendations, RSA/AES breakdowns, and security classifications.",
    accent: "from-emerald-500/20 to-emerald-500/0",
    iconColor: "text-emerald-400",
    href: "/reports",
  },
  {
    icon: FlaskConical,
    title: "Hybrid Lab Simulator",
    description:
      "Step-by-step interactive lab: generate keys, encrypt messages, simulate transmission, and decrypt — all with live cryptographic logs.",
    accent: "from-amber-500/20 to-amber-500/0",
    iconColor: "text-amber-400",
    href: "/hybrid-lab",
  },
  {
    icon: Key,
    title: "Key Vault",
    description:
      "Securely store, browse, and manage your RSA & AES key pairs. Inspect key metadata, sizes, and associated encryption contexts.",
    accent: "from-rose-500/20 to-rose-500/0",
    iconColor: "text-rose-400",
    href: "/vault",
  },
  {
    icon: BookOpen,
    title: "Cryptography Education",
    description:
      "Deep-dive explainers on RSA, AES, hybrid encryption, prime factorization, Euler's Totient, entropy, and modular arithmetic.",
    accent: "from-cyan-500/20 to-cyan-500/0",
    iconColor: "text-cyan-400",
    href: "/dashboard",
  },
];

// ─── How it Works / Timeline ──────────────────────────────────
const timelineSteps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Document",
    description:
      "Upload TXT, PDF, DOCX, JSON, CSV or image files. CipherScope reads the file content and prepares it for the encryption pipeline.",
    color: "border-sky-500/40 bg-sky-500/5",
    iconColor: "text-sky-400",
    dotColor: "bg-sky-400",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Configure Encryption Settings",
    description:
      "Select AES key size (128/192/256-bit) and mode (GCM, CBC, ECB). Set RSA modulus size (1024–4096-bit) and public exponent.",
    color: "border-violet-500/40 bg-violet-500/5",
    iconColor: "text-violet-400",
    dotColor: "bg-violet-400",
  },
  {
    step: "03",
    icon: Key,
    title: "Generate Key Pairs",
    description:
      "A fresh AES session key and RSA key pair are generated. The AES key encrypts your file; the RSA public key encrypts the AES key.",
    color: "border-amber-500/40 bg-amber-500/5",
    iconColor: "text-amber-400",
    dotColor: "bg-amber-400",
  },
  {
    step: "04",
    icon: Layers,
    title: "Hybrid Encryption Runs",
    description:
      "File content is encrypted with AES. The AES session key is wrapped with RSA. Both are packaged into a secure downloadable bundle.",
    color: "border-emerald-500/40 bg-emerald-500/5",
    iconColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
  },
  {
    step: "05",
    icon: FileSearch,
    title: "Analyze & Score",
    description:
      "The analysis engine calculates Shannon entropy, detects block repetition, audits RSA strength, and assigns an overall security score.",
    color: "border-rose-500/40 bg-rose-500/5",
    iconColor: "text-rose-400",
    dotColor: "bg-rose-400",
  },
  {
    step: "06",
    icon: Download,
    title: "Export Report & Decrypt",
    description:
      "Download structured forensic reports. Use your RSA private key to decrypt the encrypted bundle and recover the original plaintext.",
    color: "border-cyan-500/40 bg-cyan-500/5",
    iconColor: "text-cyan-400",
    dotColor: "bg-cyan-400",
  },
];



// ─── Section wrapper helpers ───────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-medium tracking-[0.18em] uppercase mb-4">
      {children}
    </span>
  );
}

// ─── Features Section ──────────────────────────────────────────
function FeaturesSection() {
  return (
    <section className="relative px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 lg:pb-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <SectionLabel>Platform Capabilities</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">
              secure & analyze
            </span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            A unified cryptographic workspace built for security researchers, students,
            and professionals working with hybrid encryption systems.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ staggerChildren: 0.08 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {features.map((f) => {
            const Icon = f.icon;
            const colors = getBeamColors(f.accent);
            return (
              <motion.div key={f.title} variants={fadeUp}>
                <Link href={f.href} className="group block h-full">
                  <div className="relative h-full rounded-2xl border border-white/8 bg-white/[0.02] p-6 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1">
                    <BorderBeam
                      size={150}
                      duration={8}
                      colorFrom={colors.from}
                      colorTo={colors.to}
                    />
                    {/* accent glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                    />
                    <div className="relative z-10">
                      <div
                        className={`w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center mb-4 ${f.iconColor}`}
                      >
                        <Icon size={18} />
                      </div>
                      <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
                      <div className="flex items-center gap-1 mt-4 text-xs text-white/30 group-hover:text-white/60 transition-colors">
                        Open <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Timeline Section ──────────────────────────────────────────
function TimelineSection() {
  return (
    <section className="relative px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
      {/* faint vertical center line */}
      <div className="absolute left-1/2 top-48 bottom-48 w-[2px] -translate-x-1/2 hidden lg:block pointer-events-none">
        {/* Static track */}
        <div className="absolute inset-0 bg-white/[0.03]" />
        {/* Animated glow overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-sky-500 via-violet-500 via-amber-500 via-emerald-500 via-rose-500 to-cyan-500 origin-top"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-20"
        >
          <SectionLabel>Encryption Workflow</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
            How CipherScope works
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            From raw file to encrypted bundle and forensic report — six clear steps.
          </p>
        </motion.div>

        <div className="flex flex-col gap-10">
          {timelineSteps.map((step, i) => {
            const Icon = step.icon;
            const isRight = i % 2 === 1;
            return (
              <motion.div
                key={step.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                className={`flex flex-col lg:flex-row items-start gap-4 sm:gap-6 ${isRight ? "lg:flex-row-reverse" : ""}`}
              >
                {/* Card */}
                <div className="flex-1">
                  <div
                    className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${step.color}`}
                  >
                    <BorderBeam
                      size={150}
                      duration={8}
                      colorFrom={getBeamColors(step.color).from}
                      colorTo={getBeamColors(step.color).to}
                    />
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center ${step.iconColor}`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="text-white/25 text-xs font-mono tracking-widest">
                        STEP {step.step}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Center dot */}
                <div className="hidden lg:flex flex-col items-center self-start mt-7 flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ring-4 ring-black ${step.dotColor}`} />
                </div>

                {/* Spacer */}
                <div className="flex-1 hidden lg:block" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



// ─── About / Project Section ───────────────────────────────────
function AboutSection() {
  const bullets = [
    "Hybrid RSA–AES encryption with configurable key sizes and modes",
    "File support: TXT, PDF, DOCX, JSON, CSV, and image types",
    "Shannon entropy calculation and block-pattern detection",
    "Downloadable encrypted bundles with embedded metadata",
    "Interactive step-by-step Hybrid Lab for hands-on learning",
    "Structured forensic reports exportable as PDF or JSON",
  ];

  return (
    <section className="relative px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left – text */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <SectionLabel>About the Project</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight mb-5 sm:mb-6">
            A complete{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
              cryptographic environment
            </span>
          </h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            CipherScope (originally CipherVault) is a full-stack secure document
            encryption platform built around hybrid RSA–AES cryptography. It was
            designed to function as a professional workspace rather than a basic
            encryption tool — combining real encryption operations, forensic auditing,
            and deep educational content in a single application.
          </p>
          <p className="text-slate-400 leading-relaxed mb-8">
            The platform demonstrates how modern secure communication systems work
            internally: AES handles high-speed bulk encryption while RSA provides
            secure key exchange, mirroring the approach used in TLS/HTTPS, PGP, and
            enterprise document security products.
          </p>

          <ul className="space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-slate-300">
                <CheckCircle size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right – visual code card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="relative"
        >
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0f] overflow-hidden shadow-2xl">
            {/* Terminal bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="ml-3 text-xs text-white/20 font-mono">cipher_scope.log</span>
            </div>
            {/* Log content */}
            <div className="p-5 font-mono text-xs leading-6 space-y-1">
              {[
                { c: "text-white/30", t: "// Hybrid RSA-AES Encryption Pipeline" },
                { c: "text-emerald-400", t: "[✓] File loaded: report_q1.pdf (2.4 MB)" },
                { c: "text-sky-400", t: "[→] Generating AES-256-GCM session key..." },
                { c: "text-emerald-400", t: "[✓] AES session key generated (256-bit)" },
                { c: "text-sky-400", t: "[→] Generating RSA-4096 key pair..." },
                { c: "text-emerald-400", t: "[✓] RSA public/private pair ready" },
                { c: "text-amber-400", t: "[~] Encrypting file content with AES..." },
                { c: "text-emerald-400", t: "[✓] Ciphertext: 2.4 MB → 2.41 MB" },
                { c: "text-amber-400", t: "[~] Wrapping AES key with RSA public key..." },
                { c: "text-emerald-400", t: "[✓] Encrypted AES key: 512 bytes" },
                { c: "text-violet-400", t: "[→] Packaging secure bundle..." },
                { c: "text-emerald-400", t: "[✓] Bundle ready: report_q1.csc" },
                { c: "text-white/30", t: "// Entropy: 7.94 bits/byte  Score: 91%" },
                {
                  c: "text-sky-300",
                  t: "[✓] Analysis complete — No weaknesses detected",
                },
              ].map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className={line.c}
                >
                  {line.t}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Floating badge */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold shadow-lg backdrop-blur"
          >
            Security Score: 91% ↑
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}



// ─── Root Layout ───────────────────────────────────────────────
export default function AgencyHeroSection() {
  const navigationData: NavigationSection[] = [
    { title: "Home", href: "/", isActive: true },
    { title: "Dashboard", href: "/dashboard" },
    { title: "Analyze", href: "/analyze" },
    { title: "Hybrid Lab", href: "/hybrid-lab" },
    { title: "Reports", href: "/reports" },
    { title: "Key Vault", href: "/vault" },
  ];

  return (
    <div className="relative min-h-screen bg-black">
      <Header navigationData={navigationData} />
      <main className="relative">
        {/* Sticky hero */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center z-0 overflow-hidden bg-black">
          <HeroSection />
        </div>

        {/* Scrollable content stacks over hero */}
        <div className="relative z-10 mt-[100px] bg-zinc-950 shadow-[0_-40px_80px_rgba(0,0,0,0.9)] rounded-t-[3rem] border-t border-zinc-900">
          <GlassmorphismMinimalMetricsBlock />
          <FeaturesSection />
          <TimelineSection />
          <AboutSection />

          {/* Footer */}
          <footer className="border-t border-white/5 px-4 sm:px-6 py-8">
            <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-white/30 text-xs sm:text-sm">© 2026 CipherScope. All rights reserved.</p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {[
                  { label: "Analyze", href: "/analyze" },
                  { label: "Hybrid Lab", href: "/hybrid-lab" },
                  { label: "Reports", href: "/reports" },
                  { label: "Key Vault", href: "/vault" },
                ].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-white/30 text-sm hover:text-white/70 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
