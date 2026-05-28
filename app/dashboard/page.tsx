"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import { getReports, getStats, Report } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  Activity, BarChart3, ChevronRight, Clock, Download,
  Settings, TrendingDown, TrendingUp, Zap, Shield,
  FileText, AlertTriangle, Lock, Brain, Menu,
} from "lucide-react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, BarChart, Bar, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

// ─── Animations ──────────────────────────────────────────────────────────────
const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 80) return "#10b981";
  if (s >= 60) return "#f59e0b";
  if (s >= 40) return "#f97316";
  return "#ef4444";
}
function scoreLabel(s: number) {
  if (s >= 80) return "Secure";
  if (s >= 60) return "Moderate";
  if (s >= 40) return "Weak";
  return "Critical";
}
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <motion.div variants={item} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur hover:border-border/60 hover:shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] to-transparent -z-10" />
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-xl" style={{ backgroundColor: color + "20" }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40 mt-1">{label}</p>
      <p className="text-xs text-foreground/50 mt-1">{sub}</p>
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/50">{children}</h2>
      <div className="h-px flex-1 bg-border/30" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navData = [
    { title: "Home", href: "/" },
    { title: "Dashboard", href: "/dashboard", isActive: true },
    { title: "Analyze", href: "/analyze" },
    { title: "Hybrid Lab", href: "/hybrid-lab" },
    { title: "Visualizations", href: "/visualizations" },
    { title: "Reports", href: "/reports" },
    { title: "Learn", href: "/learn" },
    { title: "Profile", href: "/profile" },
  ];

  const [hasMounted, setHasMounted] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setReports(getReports());
    const handler = () => setReports(getReports());
    window.addEventListener("cipher_scope_db_update", handler);
    return () => window.removeEventListener("cipher_scope_db_update", handler);
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const latest = reports[0] ?? null;

  const avgScore = useMemo(() => {
    if (!reports.length) return 0;
    return Math.round(reports.reduce((a, r) => a + r.securityScore, 0) / reports.length);
  }, [reports]);

  const vulnCount = useMemo(() =>
    reports.reduce((a, r) => a + (r.rsa?.vulnerabilities?.length ?? 0), 0), [reports]);

  const latestAiJson = useMemo(() => {
    if (!latest) return null;
    const sp = latest.patterns?.structuredParameters?.[0];
    if (!sp?.value) return null;
    try { return JSON.parse(sp.value); } catch { return null; }
  }, [latest]);

  // Score trend: one point per report (most recent last)
  const scoreTrend = useMemo(() => {
    return [...reports].reverse().map((r, i) => ({
      name: `#${i + 1}`,
      score: r.securityScore,
      file: r.fileName.slice(0, 12),
    }));
  }, [reports]);

  // Entropy trend
  const entropyTrend = useMemo(() => {
    return [...reports].reverse().map((r, i) => ({
      name: `#${i + 1}`,
      entropy: r.entropy?.value ?? 0,
    }));
  }, [reports]);

  // RSA key radar
  const rsaRadar = useMemo(() => {
    if (!latest) return [];
    const ks = latest.rsa?.keySize ?? 0;
    const ex = latest.rsa?.exponent ?? 0;
    return [
      { metric: "Key Size", score: Math.min(100, Math.round((ks / 4096) * 100)) },
      { metric: "Exponent", score: ex === 65537 ? 95 : 20 },
      { metric: "AES Mode", score: latest.aes?.mode === "GCM" ? 95 : latest.aes?.mode === "CBC" ? 60 : 20 },
      { metric: "Entropy", score: Math.round((latest.entropy?.value / 8) * 100) },
      { metric: "Password", score: latest.aes?.passwordComplexity === "Strong" ? 90 : 30 },
    ];
  }, [latest]);

  // File type bar chart
  const fileTypeBar = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [reports]);

  if (!hasMounted) {
    return (
      <div className="relative min-h-screen bg-background">
        <Header navigationData={navData} />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-pulse text-foreground/40 text-sm">Loading dashboard…</div>
        </div>
      </div>
    );
  }

  const isEmpty = reports.length === 0;

  return (
    <div className="relative min-h-screen bg-background">
      <Header navigationData={navData} />
      <div className="pt-20">
        <main className="relative min-h-[calc(100vh-80px)] bg-background overflow-hidden">
          {/* Background blobs */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-foreground/[0.03] blur-[140px]" />
            <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-foreground/[0.025] blur-[120px]" />
            <div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.02] blur-[150px]" />
          </div>

          {/* Sub-nav */}
          <nav className="border-b border-border/40 bg-background/40 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground tracking-tight">Security Operations Dashboard</span>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 hover:bg-background/60 rounded-lg">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden md:flex gap-1">
                {[["Overview", Shield], ["Entropy", Activity], ["Algorithms", Zap], ["History", Clock]].map(([label, Icon]: any) => (
                  <Button key={label} variant="ghost" size="sm" className="gap-2 text-foreground/60 hover:text-foreground text-xs uppercase tracking-[0.1em]">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </Button>
                ))}
              </div>
            </div>
          </nav>

          <div className="relative px-6 py-8 lg:py-12">
            <div className="mx-auto max-w-7xl space-y-10">

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Dashboard
                  </Badge>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    Crypto Forensics Lab
                  </h1>
                  <p className="text-foreground/60 max-w-xl text-sm">
                    {isEmpty
                      ? "No analyses yet. Upload a document on the Analyze page to get started."
                      : `Monitoring ${reports.length} document${reports.length > 1 ? "s" : ""} — avg security score ${avgScore}% · Last analysis: ${relTime(reports[0].analysisDate)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full border-border/40 bg-background/60 backdrop-blur" aria-label="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Link href="/analyze">
                    <Button className="rounded-full gap-2 bg-primary text-primary-foreground">
                      <Zap className="h-4 w-4" /> Analyze New File
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {isEmpty ? (
                /* Empty state */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-background/40 py-24 text-center gap-4">
                  <Shield className="h-12 w-12 text-foreground/20" />
                  <p className="text-lg font-semibold text-foreground/40">No analyses yet</p>
                  <p className="text-sm text-foreground/30 max-w-xs">Upload a document on the Analyze page and click "Save & Go to Dashboard" to see live forensic data here.</p>
                  <Link href="/analyze"><Button className="mt-2 rounded-full gap-2"><Zap className="h-4 w-4" />Start Analyzing</Button></Link>
                </motion.div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="visible" className="space-y-8">

                  {/* ── Metric Cards ─────────────────────────────────────── */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard label="Files Analyzed" value={reports.length.toString()} sub="total documents" icon={<FileText className="h-5 w-5" />} color="#6366f1" />
                    <MetricCard label="Avg Security Score" value={`${avgScore}/100`} sub={scoreLabel(avgScore)} icon={<Shield className="h-5 w-5" />} color={scoreColor(avgScore)} />
                    <MetricCard label="Latest RSA Key" value={latest ? `${latest.rsa.keySize}-bit` : "—"} sub={latest?.rsa.riskLevel ?? ""} icon={<Lock className="h-5 w-5" />} color="#8b5cf6" />
                    <MetricCard label="Vulnerabilities" value={vulnCount.toString()} sub="across all reports" icon={<AlertTriangle className="h-5 w-5" />} color={vulnCount > 0 ? "#ef4444" : "#10b981"} />
                  </div>

                  {/* ── Latest AI Forensic Spotlight ─────────────────────── */}
                  {latest && (
                    <div>
                      <SectionTitle>Latest AI Forensic Analysis — {latest.fileName}</SectionTitle>
                      <motion.div variants={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-5">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">AI Forensic Findings</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs border-border/40">{latest.type}</Badge>
                            <Badge variant="outline" className="text-xs" style={{ borderColor: scoreColor(latest.securityScore) + "50", color: scoreColor(latest.securityScore), backgroundColor: scoreColor(latest.securityScore) + "15" }}>
                              {latest.securityScore}/100 · {scoreLabel(latest.securityScore)}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-border/40 text-foreground/50">{relTime(latest.analysisDate)}</Badge>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Security Assessment from AI */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                              <Brain className="h-3.5 w-3.5 text-violet-400" /> Security Assessment
                            </p>
                            <p className="text-sm text-foreground/70 leading-relaxed bg-foreground/[0.02] border border-border/10 rounded-xl p-4 min-h-[100px]">
                              {latestAiJson?.securityAssessment || latest.findings || "No AI assessment available."}
                            </p>
                          </div>

                          {/* Recommendations from AI */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-orange-400" /> AI Recommendations
                            </p>
                            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                              {(latestAiJson?.recommendations ?? latest.recommendations ?? []).map((r: any, i: number) => {
                                const colors: Record<string, string> = {
                                  Critical: "text-red-400 border-red-500/20 bg-red-500/10",
                                  High: "text-orange-400 border-orange-500/20 bg-orange-500/10",
                                  Medium: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
                                  Low: "text-blue-400 border-blue-500/20 bg-blue-500/10",
                                };
                                const cls = colors[r.priority] ?? colors.Low;
                                return (
                                  <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${cls}`}>
                                    <span className="font-bold shrink-0">{r.priority}</span>
                                    <span>{r.action}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Crypto params row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/10">
                          {[
                            { k: "Entropy", v: `${latest.entropy?.value}/8.0`, s: latest.entropy?.classification },
                            { k: "RSA Key", v: `${latest.rsa?.keySize}-bit`, s: latest.rsa?.riskLevel },
                            { k: "AES Mode", v: latest.aes?.mode, s: latest.aes?.keyStrength },
                            { k: "Password", v: latest.aes?.passwordComplexity, s: latest.aes?.encryptionMode },
                          ].map(({ k, v, s }) => (
                            <div key={k} className="rounded-xl bg-foreground/[0.03] border border-border/10 p-3 text-center">
                              <p className="text-xs text-foreground/40 mb-1">{k}</p>
                              <p className="text-sm font-bold text-foreground">{v}</p>
                              <p className="text-[10px] text-foreground/40 mt-0.5">{s}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ── Charts row ────────────────────────────────────────── */}
                  <div>
                    <SectionTitle>Security Trends</SectionTitle>
                    <div className="grid gap-6 lg:grid-cols-2">

                      {/* Score trend */}
                      <motion.div variants={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-1">Security Score Trend</p>
                        <p className="text-xs text-foreground/40 mb-4">Score per uploaded document</p>
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={scoreTrend} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                              formatter={(v: any, _: any, p: any) => [`${v}/100 (${p.payload.file})`, "Score"]}
                            />
                            <Line type="natural" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </motion.div>

                      {/* Entropy trend */}
                      <motion.div variants={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-1">Entropy Trend</p>
                        <p className="text-xs text-foreground/40 mb-4">Shannon entropy per document (max 8.0)</p>
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={entropyTrend} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                            <YAxis domain={[0, 8]} stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} />
                            <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                            <Line type="natural" dataKey="entropy" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </motion.div>
                    </div>
                  </div>

                  {/* ── Bottom row: Radar + File bar + Recent ─────────────── */}
                  <div className="grid gap-6 lg:grid-cols-3">

                    {/* Radar — latest doc crypto strengths */}
                    {latest && rsaRadar.length > 0 && (
                      <motion.div variants={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-1">Latest Document Profile</p>
                        <p className="text-xs text-foreground/40 mb-4">{latest.fileName.slice(0, 24)}</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={rsaRadar}>
                            <PolarGrid stroke="var(--border)" opacity={0.4} />
                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "var(--foreground)", opacity: 0.6 }} />
                            <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                            <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}

                    {/* File type distribution bar */}
                    <motion.div variants={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-1">File Type Distribution</p>
                      <p className="text-xs text-foreground/40 mb-4">Analyzed document types</p>
                      {fileTypeBar.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={fileTypeBar} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                            <YAxis stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-[220px] text-foreground/20 text-sm">No data</div>
                      )}
                    </motion.div>

                    {/* Recent reports list */}
                    <motion.div variants={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-4">Recent Analyses</p>
                      <div className="space-y-2">
                        {reports.slice(0, 5).map((r, i) => (
                          <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/15 bg-background/40 px-3 py-2.5 gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground truncate">{r.fileName}</p>
                              <p className="text-[10px] text-foreground/40">{relTime(r.analysisDate)}</p>
                            </div>
                            <span className="text-xs font-bold shrink-0" style={{ color: scoreColor(r.securityScore) }}>{r.securityScore}</span>
                          </div>
                        ))}
                      </div>
                      <Link href="/reports" className="mt-4 flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground transition-colors">
                        View all reports <ChevronRight className="h-3 w-3" />
                      </Link>
                    </motion.div>
                  </div>

                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
