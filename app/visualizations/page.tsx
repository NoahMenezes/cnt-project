"use client";

import React, { useState } from "react";
import Header from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, AlertTriangle, FileSearch, Zap
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, ReferenceLine
} from "recharts";
import chartData from "./data/chartData";

const NAV = [
  { title: "Home", href: "/" }, { title: "Dashboard", href: "/dashboard" },
  { title: "Analyze", href: "/analyze" }, { title: "Hybrid Lab", href: "/hybrid-lab" },
  { title: "Visualizations", href: "/visualizations", isActive: true },
  { title: "Reports", href: "/reports" }, { title: "Learn", href: "/learn" },
  { title: "Profile", href: "/profile" },
];

const FILTERS = ["daily", "weekly", "monthly"] as const;
type Filter = typeof FILTERS[number];

const DONUT_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#3b82f6"];
const ENTROPY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4"];
const TOOLTIP_STYLE = {
  backgroundColor: "var(--background)", border: "1px solid var(--border)",
  borderRadius: 8, fontSize: 12, padding: "8px 12px"
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground">{title}</h3>
      {children}
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-foreground/40">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-none mt-0.5">{value}</p>
        {sub && <p className="text-xs text-foreground/40 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function VisualizationsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("weekly");
  const s = chartData.statistics;

  return (
    <div className="relative min-h-screen bg-background">
      <Header navigationData={NAV} />
      <div className="pt-20">
        <main className="relative min-h-[calc(100vh-80px)] bg-background">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/[0.03] blur-[140px]" />
          </div>
          <div className="relative px-6 py-8 lg:py-12">
            <div className="mx-auto max-w-7xl space-y-8">

              {/* Page Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge variant="outline" className="mb-4 inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
                  <BarChart3 className="h-3.5 w-3.5" /> Analytics
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Visualizations</h1>
                <p className="mt-2 text-foreground/60 max-w-2xl">Rich analytics across all past analyses — security trends, weakness distributions, entropy patterns, and performance metrics.</p>
              </motion.div>

              {/* Stats Row */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Total Analyses" value={s.totalAnalyses} icon={FileSearch} />
                <StatCard label="Avg Security Score" value={s.averageScore} icon={TrendingUp} />
                <StatCard label="Weak Findings" value={s.weakFindings} icon={AlertTriangle} />
                <StatCard label="Files Processed" value={s.filesProcessed} icon={Zap} />
                <StatCard label="Top Issue" value={s.mostCommonIssue} icon={BarChart3} />
              </motion.div>

              {/* Filter Bar */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }}
                className="flex items-center gap-2">
                <span className="text-xs text-foreground/40 uppercase tracking-widest">Range:</span>
                <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
                  {FILTERS.map(f => (
                    <button key={f} onClick={() => setActiveFilter(f)}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${activeFilter === f ? "bg-background text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Charts Grid */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                className="grid gap-6 lg:grid-cols-2">

                {/* Security Score Trends */}
                <SectionCard title="Security Score Trends">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData.securityTrends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                      <XAxis dataKey="date" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} width={30} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--foreground)" }} />
                      <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Threshold", fill: "#f59e0b", fontSize: 10, position: "right" }} />
                      <Line type="natural" dataKey="avgScore" stroke="var(--primary)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </SectionCard>

                {/* RSA vs AES */}
                <SectionCard title="RSA vs AES Issues by Risk Level">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData.rsaVsAES} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                      <XAxis dataKey="category" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} />
                      <YAxis stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} width={25} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="rsa" name="RSA" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="aes" name="AES" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>

                {/* Weakness Distribution */}
                <SectionCard title="Weakness Distribution">
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="60%" height={200}>
                      <PieChart>
                        <Pie data={chartData.weaknessDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%"
                          innerRadius={55} outerRadius={85} paddingAngle={3}>
                          {chartData.weaknessDistribution.map((_, i) => (
                            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v}%`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {chartData.weaknessDistribution.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2 text-xs">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i] }} />
                          <span className="text-foreground/60 flex-1">{d.name}</span>
                          <span className="text-foreground font-semibold">{d.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>

                {/* Entropy Distribution */}
                <SectionCard title="Entropy Distribution">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData.entropyDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                      <XAxis dataKey="range" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} />
                      <YAxis stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} width={25} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Files"]} />
                      <Bar dataKey="count" name="Files" radius={[4, 4, 0, 0]}>
                        {chartData.entropyDistribution.map((_, i) => (
                          <Cell key={i} fill={ENTROPY_COLORS[i % ENTROPY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>

                {/* Character Frequency */}
                <SectionCard title="Character Frequency (Top 10)">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData.characterFrequency} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} horizontal={false} />
                      <XAxis type="number" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="char" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} width={20} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Occurrences"]} />
                      <Bar dataKey="frequency" fill="var(--primary)" radius={[0, 4, 4, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>

                {/* Encryption Time vs File Size */}
                <SectionCard title="Encryption Time vs File Size">
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="fileSizeKB" name="File Size" unit=" KB" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} />
                      <YAxis dataKey="timeMs" name="Time" unit=" ms" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} width={45} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [v, n === "fileSizeKB" ? "KB" : "ms"]} />
                      <Scatter data={chartData.encryptionTimeVsFileSize} fill="#6366f1" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </SectionCard>

                {/* Activity Trends */}
                <div className="lg:col-span-2">
                  <SectionCard title="Analysis Activity Trends">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData.activityTrends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                        <XAxis dataKey="date" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} />
                        <YAxis stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 11 }} width={25} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Analyses"]} />
                        <Area type="natural" dataKey="analyses" stroke="var(--primary)" strokeWidth={2.5} fill="url(#actGrad)" dot={false} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>

              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
