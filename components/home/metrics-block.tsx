"use client";

import { motion, type Variants } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, Users, Zap } from "lucide-react";
import dynamic from "next/dynamic";

const PhoneModel = dynamic(() => import("@/components/ui/phone-model"), { ssr: false });

const metrics = [
  {
    label: "Analyses Performed",
    value: "1.2k+",
    delta: "Active",
    description: "files securely analyzed for encryption configuration strengths",
  },
  {
    label: "Weak Keys Flagged",
    value: "142",
    delta: "Critical",
    description: "deprecated RSA moduli and ECB block ciphers identified",
  },
  {
    label: "Average Security Score",
    value: "71.4%",
    delta: "Moderate",
    description: "overall strength of Hybrid RSA-AES setups evaluated",
  },
  {
    label: "Analysis Processing Time",
    value: "<1.2s",
    delta: "Optimal",
    description: "average duration to parse entropy and detect file patterns",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function GlassmorphismMinimalMetricsBlock() {
  return (
    <section className="relative overflow-hidden px-6 py-24 lg:py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[380px] w-[380px] rounded-full bg-foreground/[0.03] blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-foreground/[0.025] blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl space-y-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge
            variant="outline"
            className="mb-4 inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur"
          >
            <Zap className="h-3.5 w-3.5" />
            cryptographic audit
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Real-time security analytics and forensic insights
          </h2>
          <p className="mt-5 text-base leading-relaxed text-foreground/70 md:text-lg">
            Monitor file entropy, inspect RSA configurations, and analyze key derivation complexities on one unified interface.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.08 }}
          className="grid gap-8 lg:grid-cols-3 items-center py-10"
        >
          {/* Left Column */}
          <div className="space-y-6">
            {metrics.slice(0, 2).map((metric) => (
              <motion.div key={metric.label} variants={fadeUp}>
                <Card className="group relative overflow-hidden rounded-3xl border border-border/50 bg-background/45 p-8 backdrop-blur-2xl transition-transform duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent" />
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/60">
                        {metric.label}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-semibold tracking-tight text-foreground">
                        {metric.value}
                      </span>
                      <span className="rounded-full border border-border/40 bg-background/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 backdrop-blur">
                        {metric.delta}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/70">
                      {metric.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Center Column: 3D Phone Model */}
          <motion.div variants={fadeUp} className="relative h-[650px] w-full hidden lg:flex items-center justify-center">
            <div className="absolute inset-0 rounded-[4rem] bg-gradient-to-b from-primary/5 to-transparent blur-3xl -z-10" />
            <PhoneModel />
          </motion.div>

          {/* Right Column */}
          <div className="space-y-4">
            {metrics.slice(2, 4).map((metric) => (
              <motion.div key={metric.label} variants={fadeUp}>
                <Card className="group relative overflow-hidden rounded-3xl border border-border/50 bg-background/45 p-8 backdrop-blur-2xl transition-transform duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent" />
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/60">
                        {metric.label}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-semibold tracking-tight text-foreground">
                        {metric.value}
                      </span>
                      <span className="rounded-full border border-border/40 bg-background/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 backdrop-blur">
                        {metric.delta}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/70">
                      {metric.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
