"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { getReports, getStats, Report } from "@/lib/store";

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
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setReports(getReports());
  }, []);

  const chartData = useMemo(() => {
    const s = getStats();
    
    // 1. Security Trends (group by date)
    const trendsMap: Record<string, { sum: number; count: number }> = {};
    reports.forEach((r) => {
      const dateStr = new Date(r.analysisDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!trendsMap[dateStr]) trendsMap[dateStr] = { sum: 0, count: 0 };
      trendsMap[dateStr].sum += r.securityScore;
      trendsMap[dateStr].count += 1;
    });
    let securityTrends = Object.entries(trendsMap).map(([date, data]) => ({
      date,
      avgScore: Math.round(data.sum / data.count),
    }));
    if (securityTrends.length === 0) {
      securityTrends = [
        { date: "Jun 12", avgScore: 80 },
        { date: "Jun 13", avgScore: 69 },
        { date: "Jun 14", avgScore: 77 },
      ];
    }

    // 2. RSA vs AES score categories count
    let rsaCrit = 0, rsaWeak = 0, rsaMod = 0, rsaSec = 0;
    let aesCrit = 0, aesWeak = 0, aesMod = 0, aesSec = 0;
    reports.forEach((r) => {
      if (r.rsa.keySize < 1024) rsaCrit++;
      else if (r.rsa.keySize < 2048) rsaWeak++;
      else if (r.rsa.keySize < 4096) rsaMod++;
      else rsaSec++;

      if (r.aes.mode === "ECB" && r.aes.passwordComplexity === "Weak") aesCrit++;
      else if (r.aes.mode === "ECB" || r.aes.passwordComplexity === "Weak") aesWeak++;
      else if (r.aes.mode === "CBC") aesMod++;
      else aesSec++;
    });

    const rsaVsAES = [
      { category: "Critical", rsa: rsaCrit, aes: aesCrit },
      { category: "Weak", rsa: rsaWeak, aes: aesWeak },
      { category: "Moderate", rsa: rsaMod, aes: aesMod },
      { category: "Secure", rsa: rsaSec, aes: aesSec },
    ];

    // 3. Weakness distribution
    let smallRsa = 0;
    let weakExp = 0;
    let ecbMode = 0;
    let weakPass = 0;
    reports.forEach((r) => {
      if (r.rsa.keySize < 2048) smallRsa++;
      if (r.rsa.exponent === 3) weakExp++;
      if (r.aes.mode === "ECB") ecbMode++;
      if (r.aes.passwordComplexity === "Weak") weakPass++;
    });
    const totalIssues = (smallRsa + weakExp + ecbMode + weakPass) || 1;
    const weaknessDistribution = [
      { name: "Small RSA Key", value: Math.round((smallRsa / totalIssues) * 100), count: smallRsa },
      { name: "Weak Exponent", value: Math.round((weakExp / totalIssues) * 100), count: weakExp },
      { name: "ECB Mode", value: Math.round((ecbMode / totalIssues) * 100), count: ecbMode },
      { name: "Weak Password", value: Math.round((weakPass / totalIssues) * 100), count: weakPass },
    ].filter(w => w.count > 0);

    if (weaknessDistribution.length === 0) {
      weaknessDistribution.push({ name: "No Issues", value: 100, count: 0 });
    }

    // 4. Entropy Distribution
    let bucket1 = 0, bucket2 = 0, bucket3 = 0, bucket4 = 0, bucket5 = 0;
    reports.forEach((r) => {
      const e = r.entropy.value;
      if (e < 2) bucket1++;
      else if (e < 4) bucket2++;
      else if (e < 6) bucket3++;
      else if (e < 7.5) bucket4++;
      else bucket5++;
    });
    const entropyDistribution = [
      { range: "0–2", count: bucket1, classification: "Very Low" },
      { range: "2–4", count: bucket2, classification: "Low" },
      { range: "4–6", count: bucket3, classification: "Medium" },
      { range: "6–7.5", count: bucket4, classification: "High" },
      { range: "7.5–8", count: bucket5, classification: "Very High" },
    ];

    // 5. Hex/Random characters frequency
    const characterFrequency = [
      { char: "E", frequency: 182 },
      { char: "A", frequency: 165 },
      { char: "F", frequency: 148 },
      { char: "0", frequency: 134 },
      { char: "B", frequency: 129 },
      { char: "C", frequency: 121 },
      { char: "D", frequency: 118 },
      { char: "1", frequency: 112 },
      { char: "9", frequency: 104 },
      { char: "3", frequency: 97 },
    ];

    // 6. Encryption time vs size
    const encryptionTimeVsFileSize = reports.map((r) => {
      let sizeKB = 10;
      if (r.fileSize.includes("KB")) sizeKB = parseFloat(r.fileSize);
      else if (r.fileSize.includes("MB")) sizeKB = parseFloat(r.fileSize) * 1024;
      else sizeKB = parseFloat(r.fileSize) / 1024;

      let baseTime = sizeKB * 1.5;
      if (r.aes.mode === "CBC") baseTime *= 1.2;
      if (r.rsa.keySize >= 4096) baseTime += 80;
      else if (r.rsa.keySize >= 2048) baseTime += 30;

      return {
        fileSizeKB: Math.round(sizeKB),
        timeMs: Math.round(baseTime),
        fileName: r.fileName
      };
    });

    // 7. Activity Trends
    const actMap: Record<string, number> = {};
    reports.forEach((r) => {
      const dateStr = new Date(r.analysisDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      actMap[dateStr] = (actMap[dateStr] || 0) + 1;
    });
    let activityTrends = Object.entries(actMap).map(([date, count]) => ({
      date,
      analyses: count,
    }));
    if (activityTrends.length === 0) {
      activityTrends = [
        { date: "Jun 12", analyses: 15 },
        { date: "Jun 13", analyses: 11 },
        { date: "Jun 14", analyses: 4 },
      ];
    }

    return {
      securityTrends,
      rsaVsAES,
      weaknessDistribution,
      entropyDistribution,
      characterFrequency,
      encryptionTimeVsFileSize,
      activityTrends,
      statistics: {
        totalAnalyses: s.totalFiles,
        averageScore: Math.round(s.avgSecurityScore),
        weakFindings: s.vulnerabilitiesCount,
        filesProcessed: s.totalFiles,
        mostCommonIssue: smallRsa > ecbMode ? "Weak RSA Key Size" : "ECB Mode Encryption"
      }
    };
  }, [reports]);

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
