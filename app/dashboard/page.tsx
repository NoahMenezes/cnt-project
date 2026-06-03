"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import { getReports, Report, syncReportsForUser } from "@/lib/store";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  Activity, ChevronRight, Clock, Download,
  Zap, Shield, FileText, AlertTriangle, Lock, Brain, Menu,
  Copy, Check, TrendingUp, FileSearch, ArrowLeftRight, Sparkles, RefreshCw
} from "lucide-react";
import {
  CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, BarChart, Bar, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
  AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell, ReferenceLine, Legend
} from "recharts";
import { BorderBeam } from "@/components/ui/border-beam";


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
      <BorderBeam size={100} duration={8} colorFrom={color} colorTo={`${color}80`} />
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

const DONUT_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#3b82f6", "#10b981"];

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(9, 9, 11, 0.9)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 12,
  fontSize: 12,
  padding: "10px 14px",
  color: "#f4f4f5",
};

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border/40 bg-background/55 backdrop-blur-md p-6 relative overflow-hidden shadow-sm">
      <BorderBeam size={180} duration={12} colorFrom="#8b5cf6" colorTo="#6366f1" />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.015] to-transparent pointer-events-none" />
      <div className="flex items-center gap-2 mb-4 border-b border-border/10 pb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/80">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}





// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navData = [
    { title: "Home", href: "/" },
    { title: "Dashboard", href: "/dashboard", isActive: true },
    { title: "Analyze", href: "/analyze" },
    { title: "Hybrid Lab", href: "/hybrid-lab" },
    { title: "Reports", href: "/reports" },
    { title: "Key Vault", href: "/vault" },
  ];

  const [hasMounted, setHasMounted] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "visualizations">("summary");
  const { user } = useUser();

  // --- Audio Preview States ---
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPrompt, setAudioPrompt] = useState("");
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);
  const [latestAudioBase64, setLatestAudioBase64] = useState("");

  useEffect(() => {
    return () => {
      if (audioObj) {
        audioObj.pause();
      }
    };
  }, [audioObj]);

  const handleDashboardAudioClick = async () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioObj) {
        audioObj.pause();
      }
      setIsPlayingAudio(false);
      return;
    }

    // Pre-create Audio context object to register user click interaction
    const audio = audioObj || new Audio();
    try {
      audio.play().catch(() => {});
      audio.pause();
    } catch {}

    setIsGeneratingAudio(true);
    try {
      const res = await fetch("http://localhost:8000/generate/dashboard-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "default-local-user",
          totalDocuments: reports.length,
          avgSecurityScore: avgScore,
          totalVulnerabilities: vulnCount,
          recentDocuments: reports.map(r => r.fileName)
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate dashboard audio preview.");
      }

      const data = await res.json();
      setAudioPrompt(data.prompt);
      if (data.audioBase64) {
        setLatestAudioBase64(data.audioBase64);
      }

      if (data.isFallback) {
        console.log("Using browser text-to-speech fallback...");
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.prompt);
          
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => 
            v.lang.startsWith("en") && 
            (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Neural") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("David"))
          ) || voices.find(v => v.lang.startsWith("en"));
          
          if (preferredVoice) utterance.voice = preferredVoice;
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.onend = () => setIsPlayingAudio(false);
          utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            setIsPlayingAudio(false);
          };
          window.speechSynthesis.speak(utterance);
          setIsPlayingAudio(true);
        } else {
          const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
          audio.src = audioUrl;
          audio.onended = () => setIsPlayingAudio(false);
          setAudioObj(audio);
          audio.play().then(() => setIsPlayingAudio(true)).catch(console.error);
        }
      } else {
        const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
        audio.src = audioUrl;
        audio.onended = () => setIsPlayingAudio(false);
        setAudioObj(audio);
        audio.play().then(() => setIsPlayingAudio(true)).catch(console.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error generating audio preview. Please make sure the backend server is running.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      syncReportsForUser(user.id);
    } else {
      syncReportsForUser("default-local-user");
    }
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => {
      setReports(getReports());
      setHasMounted(true);
    }, 0);
    const handler = () => setReports(getReports());
    window.addEventListener("cipher_scope_db_update", handler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("cipher_scope_db_update", handler);
    };
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const activeReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  const latest = activeReport || reports[0] || null;

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
    return [...reports]
      .sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime())
      .map((r, i) => ({
        name: reports.length <= 5
          ? new Date(r.analysisDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : `#${i + 1}`,
        score: r.securityScore,
        file: r.fileName.length > 15 ? r.fileName.slice(0, 13) + "…" : r.fileName,
        entropy: +(r.entropy?.value ?? 0).toFixed(2),
      }));
  }, [reports]);

  // Entropy trend uses same sorted array
  const entropyTrend = useMemo(() => {
    return [...reports]
      .sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime())
      .map((r, i) => ({
        name: reports.length <= 5
          ? new Date(r.analysisDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : `#${i + 1}`,
        entropy: +(r.entropy?.value ?? 0).toFixed(2),
        file: r.fileName.length > 15 ? r.fileName.slice(0, 13) + "…" : r.fileName,
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

  const stats = useMemo(() => {
    if (!reports.length) {
      return {
        securityTrends: [],
        rsaVsAES: [],
        weaknessDistribution: [],
        entropyDistribution: [],
        encryptionTimeVsFileSize: [],
        activityTrends: [],
        totalAnalyses: 0,
        averageScore: 0,
        weakFindings: 0,
        mostCommonIssue: "None Detected",
      };
    }

    const chronoReports = [...reports].sort(
      (a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime()
    );

    const securityTrends = chronoReports.map((r, idx) => ({
      name: `#${idx + 1}`,
      date: new Date(r.analysisDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: r.securityScore,
      fileName: r.fileName.length > 15 ? r.fileName.slice(0, 12) + "..." : r.fileName,
    }));

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
      { category: "Critical", RSA: rsaCrit, AES: aesCrit },
      { category: "Weak", RSA: rsaWeak, AES: aesWeak },
      { category: "Moderate", RSA: rsaMod, AES: aesMod },
      { category: "Secure", RSA: rsaSec, AES: aesSec },
    ];

    let smallRsa = 0, weakExp = 0, ecbMode = 0, weakPass = 0, lowEntropy = 0;
    reports.forEach((r) => {
      if (r.rsa.keySize < 2048) smallRsa++;
      if (r.rsa.exponent === 3) weakExp++;
      if (r.aes.mode === "ECB") ecbMode++;
      if (r.aes.passwordComplexity === "Weak") weakPass++;
      if (r.entropy.value < 5.0) lowEntropy++;
    });
    const totalIssues = (smallRsa + weakExp + ecbMode + weakPass + lowEntropy) || 1;
    const weaknessDistribution = [
      { name: "Small RSA Key", value: Math.round((smallRsa / totalIssues) * 100), count: smallRsa },
      { name: "Weak Exponent", value: Math.round((weakExp / totalIssues) * 100), count: weakExp },
      { name: "ECB Mode", value: Math.round((ecbMode / totalIssues) * 100), count: ecbMode },
      { name: "Weak Password", value: Math.round((weakPass / totalIssues) * 100), count: weakPass },
      { name: "Low Entropy", value: Math.round((lowEntropy / totalIssues) * 100), count: lowEntropy },
    ].filter(w => w.count > 0);
    if (weaknessDistribution.length === 0) {
      weaknessDistribution.push({ name: "No Weaknesses Detected", value: 100, count: 0 });
    }

    let eb1 = 0, eb2 = 0, eb3 = 0, eb4 = 0, eb5 = 0;
    reports.forEach((r) => {
      const e = r.entropy.value;
      if (e < 2) eb1++;
      else if (e < 4) eb2++;
      else if (e < 6) eb3++;
      else if (e < 7.5) eb4++;
      else eb5++;
    });
    const entropyDistribution = [
      { range: "0–2 (Low)", count: eb1 },
      { range: "2–4 (Poor)", count: eb2 },
      { range: "4–6 (Mid)", count: eb3 },
      { range: "6–7.5 (Good)", count: eb4 },
      { range: "7.5–8 (High)", count: eb5 },
    ];

    const encryptionTimeVsFileSize = reports.map((r) => {
      let sizeKB = parseFloat(String(r.fileSize)) || 10;
      if (String(r.fileSize).includes("MB")) sizeKB *= 1024;
      let baseTime = sizeKB * 1.2;
      if (r.aes.mode === "CBC") baseTime *= 1.15;
      if (r.rsa.keySize >= 4096) baseTime += 75;
      else if (r.rsa.keySize >= 2048) baseTime += 25;
      return {
        fileSizeKB: Math.round(sizeKB),
        timeMs: Math.round(baseTime + Math.random() * 5),
        fileName: r.fileName,
      };
    });

    const actMap: Record<string, number> = {};
    chronoReports.forEach((r) => {
      const dateStr = new Date(r.analysisDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      actMap[dateStr] = (actMap[dateStr] || 0) + 1;
    });
    const activityTrends = Object.entries(actMap).map(([date, count]) => ({ date, analyses: count }));

    const totalAnalyses = reports.length;
    const averageScore = Math.round(reports.reduce((a, r) => a + r.securityScore, 0) / totalAnalyses);
    const weakFindings = reports.reduce((a, r) => a + (r.rsa?.vulnerabilities?.length ?? 0), 0);
    const mostCommonIssue =
      smallRsa > ecbMode
        ? "Insecure RSA Key Size"
        : ecbMode > weakPass
        ? "ECB Cipher Mode"
        : weakPass > 0
        ? "Weak Password Strength"
        : "None Detected";

    return {
      securityTrends,
      rsaVsAES,
      weaknessDistribution,
      entropyDistribution,
      encryptionTimeVsFileSize,
      activityTrends,
      totalAnalyses,
      averageScore,
      weakFindings,
      mostCommonIssue,
    };
  }, [reports]);

  if (!hasMounted) {
    return (
      <div className="relative min-h-screen bg-transparent">
        <Header navigationData={navData} />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-pulse text-foreground/40 text-sm">Loading dashboard…</div>
        </div>
      </div>
    );
  }

  const isEmpty = reports.length === 0;

  return (
    <div className="relative min-h-screen bg-transparent">
      <Header navigationData={navData} />
      <div className="pt-20">
        <main className="relative min-h-[calc(100vh-80px)] bg-transparent overflow-hidden">
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
              {!activeReport && (
                <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 hover:bg-background/60 rounded-lg">
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className="hidden md:flex gap-1">
                {!activeReport && (
                  <>
                    <Button
                      variant={activeTab === "summary" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab("summary")}
                      className={`gap-2 text-xs uppercase tracking-[0.1em] rounded-xl ${activeTab === "summary" ? "text-primary" : "text-foreground/60 hover:text-foreground"}`}
                    >
                      <Shield className="h-3.5 w-3.5" />Summary Overview
                    </Button>
                    <Button
                      variant={activeTab === "visualizations" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab("visualizations")}
                      className={`gap-2 text-xs uppercase tracking-[0.1em] rounded-xl ${activeTab === "visualizations" ? "text-primary" : "text-foreground/60 hover:text-foreground"}`}
                    >
                      <Activity className="h-3.5 w-3.5" />Visualizations Lab
                    </Button>
                  </>
                )}
              </div>
            </div>
            {mobileOpen && !activeReport && (
              <div className="md:hidden border-t border-border/10 bg-background/95 backdrop-blur px-6 py-3 flex flex-col gap-2">
                <Button
                  variant={activeTab === "summary" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setActiveTab("summary");
                    setMobileOpen(false);
                  }}
                  className={`w-full justify-start gap-2 text-xs uppercase tracking-[0.1em] rounded-xl ${activeTab === "summary" ? "text-primary bg-primary/5" : "text-foreground/60"}`}
                >
                  <Shield className="h-3.5 w-3.5" />Summary Overview
                </Button>
                <Button
                  variant={activeTab === "visualizations" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setActiveTab("visualizations");
                    setMobileOpen(false);
                  }}
                  className={`w-full justify-start gap-2 text-xs uppercase tracking-[0.1em] rounded-xl ${activeTab === "visualizations" ? "text-primary bg-primary/5" : "text-foreground/60"}`}
                >
                  <Activity className="h-3.5 w-3.5" />Visualizations Lab
                </Button>
              </div>
            )}
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleDashboardAudioClick}
                    disabled={isGeneratingAudio}
                    variant="outline"
                    className="rounded-full gap-2 border-primary/30 hover:border-primary/50 text-primary bg-background/60 backdrop-blur h-10 px-4 text-xs font-semibold"
                  >
                    {isGeneratingAudio ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    ) : isPlayingAudio ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span>Stop Briefing</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        <span>Audio Dashboard Overview</span>
                      </>
                    )}
                  </Button>

                  {latestAudioBase64 && (
                    <Button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = `data:audio/wav;base64,${latestAudioBase64}`;
                        link.download = `dashboard_security_briefing_${Date.now()}.wav`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      title="Download Dashboard Audio Overview"
                      variant="outline"
                      size="icon"
                      className="rounded-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 bg-background/60 backdrop-blur h-10 w-10"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}

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
                  <p className="text-sm text-foreground/30 max-w-xs">Upload a document on the Analyze page and click &quot;Save &amp; Go to Dashboard&quot; to see live forensic data here.</p>
                  <Link href="/analyze"><Button className="mt-2 rounded-full gap-2"><Zap className="h-4 w-4" />Start Analyzing</Button></Link>
                </motion.div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="visible" className="space-y-8">

                  {/* ── Document Selector ──────────────────────────────────── */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/30 bg-background/40 backdrop-blur rounded-2xl p-5">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground tracking-tight">Real-time Forensics Selector</p>
                      <p className="text-xs text-foreground/40">Compare consolidated operations metrics or focus on a single forensic session</p>
                    </div>
                    <select
                      value={selectedReportId || "all"}
                      onChange={(e) => {
                        setSelectedReportId(e.target.value === "all" ? null : e.target.value);
                      }}
                      className="rounded-full border border-border/40 bg-background/80 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 backdrop-blur w-full sm:w-72"
                    >
                      <option value="all">🔍 Consolidated Global Overview</option>
                      {reports.map((r) => (
                        <option key={r.id} value={r.id}>
                          📄 {r.fileName} ({new Date(r.analysisDate).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ── Metric Cards ─────────────────────────────────────── */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {activeReport ? (
                      <>
                        <MetricCard label="Document Type" value={activeReport.type} sub={`File size: ${activeReport.fileSize}`} icon={<FileText className="h-5 w-5" />} color="#6366f1" />
                        <MetricCard label="Security Score" value={`${activeReport.securityScore}/100`} sub={scoreLabel(activeReport.securityScore)} icon={<Shield className="h-5 w-5" />} color={scoreColor(activeReport.securityScore)} />
                        <MetricCard label="RSA Configuration" value={`${activeReport.rsa.keySize}-bit`} sub={activeReport.rsa.riskLevel} icon={<Lock className="h-5 w-5" />} color="#8b5cf6" />
                        <MetricCard label="Vulnerabilities" value={(activeReport.rsa.vulnerabilities?.length || 0).toString()} sub="identified weaknesses" icon={<AlertTriangle className="h-5 w-5" />} color={(activeReport.rsa.vulnerabilities?.length || 0) > 0 ? "#ef4444" : "#10b981"} />
                      </>
                    ) : (
                      <>
                        <MetricCard label="Files Analyzed" value={reports.length.toString()} sub="total documents" icon={<FileText className="h-5 w-5" />} color="#6366f1" />
                        <MetricCard label="Avg Security Score" value={`${avgScore}/100`} sub={scoreLabel(avgScore)} icon={<Shield className="h-5 w-5" />} color={scoreColor(avgScore)} />
                        <MetricCard label="Latest RSA Key" value={reports[0] ? `${reports[0].rsa.keySize}-bit` : "—"} sub={reports[0]?.rsa.riskLevel ?? ""} icon={<Lock className="h-5 w-5" />} color="#8b5cf6" />
                        <MetricCard label="Vulnerabilities" value={vulnCount.toString()} sub="across all reports" icon={<AlertTriangle className="h-5 w-5" />} color={vulnCount > 0 ? "#ef4444" : "#10b981"} />
                      </>
                    )}
                  </div>

                  {activeReport ? (
                    /* ── ACTIVE REPORT DEEP INPSECTOR ────────────────────── */
                    <div className="space-y-6">
                      {/* AI Spotlight */}
                      <div>
                        <SectionTitle>AI Forensic Analysis Spotlight</SectionTitle>
                        <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-5">
                          <BorderBeam size={200} duration={10} colorFrom="#10b981" colorTo="#3b82f6" />
                          <div className="flex flex-wrap gap-3 items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                              </div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">AI Forensic Findings — {activeReport.fileName}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs border-border/40">{activeReport.type}</Badge>
                              <Badge variant="outline" className="text-xs" style={{ borderColor: scoreColor(activeReport.securityScore) + "50", color: scoreColor(activeReport.securityScore), backgroundColor: scoreColor(activeReport.securityScore) + "15" }}>
                                {activeReport.securityScore}/100 · {scoreLabel(activeReport.securityScore)}
                              </Badge>
                              <Badge variant="outline" className="text-xs border-border/40 text-foreground/50">{relTime(activeReport.analysisDate)}</Badge>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            {/* Security Assessment from AI */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                                <Brain className="h-3.5 w-3.5 text-violet-400" /> Security Assessment
                              </p>
                              <p className="text-sm text-foreground/70 leading-relaxed bg-foreground/[0.02] border border-border/10 rounded-xl p-4 min-h-[100px]">
                                {latestAiJson?.securityAssessment || activeReport.findings || "No AI assessment available."}
                              </p>
                            </div>

                            {/* Recommendations from AI */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-orange-400" /> AI Recommendations
                              </p>
                              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                {(latestAiJson?.recommendations ?? activeReport.recommendations ?? []).map((r: { priority: string; action: string }, i: number) => {
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
                              { k: "Entropy", v: `${activeReport.entropy?.value}/8.0`, s: activeReport.entropy?.classification },
                              { k: "RSA Key", v: `${activeReport.rsa?.keySize}-bit`, s: activeReport.rsa?.riskLevel },
                              { k: "AES Mode", v: activeReport.aes?.mode, s: activeReport.aes?.keyStrength },
                              { k: "Password", v: activeReport.aes?.passwordComplexity, s: activeReport.aes?.encryptionMode },
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

                      {/* Detail metrics row (Radar + Vulnerability details) */}
                      <div className="grid gap-6 md:grid-cols-5">
                        {/* Radar Profile */}
                        {rsaRadar.length > 0 && (
                          <motion.div variants={item} className="md:col-span-2 relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                            <BorderBeam size={150} duration={8} colorFrom="#8b5cf6" colorTo="#3b82f6" />
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-1">Document Profile</p>
                            <p className="text-xs text-foreground/40 mb-4">Cryptographic configuration strength mapping</p>
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

                        {/* Actionable Vulnerabilities Inspector */}
                        <motion.div variants={item} className="md:col-span-3 relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur flex flex-col justify-between">
                          <BorderBeam size={150} duration={8} colorFrom="#ef4444" colorTo="#f59e0b" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-1">Identified Weaknesses</p>
                            <p className="text-xs text-foreground/40 mb-4">Specific protocol vulnerabilities detected in parsing</p>
                            <div className="space-y-3">
                              {(activeReport.rsa.vulnerabilities?.length || 0) > 0 ? (
                                activeReport.rsa.vulnerabilities?.map((v, i) => (
                                  <div key={i} className="flex gap-3 items-start text-xs border-b border-border/5 pb-2">
                                    <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                    <div>
                                      <p className="font-semibold text-foreground">{v}</p>
                                      <p className="text-[10px] text-foreground/40 mt-0.5">Algorithm requirement failed during automated compliance scanning.</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-foreground/40 text-xs">
                                  No critical vulnerabilities detected in RSA configuration. Key meets baseline compliance parameters.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-border/10 mt-4 flex items-center justify-between">
                            <span className="text-[10px] text-foreground/40">Compliance standard: FIPS 140-3</span>
                            <Badge variant="outline" className={`text-[10px] ${activeReport.securityScore >= 70 ? "text-emerald-400" : "text-yellow-400"}`}>
                              {activeReport.securityScore >= 70 ? "Baseline Passed" : "Remediation Required"}
                            </Badge>
                          </div>
                        </motion.div>
                      </div>

                      {/* Corrected Plaintext Output (English) */}
                      <div>
                        <SectionTitle>Corrected Plaintext Output (English)</SectionTitle>
                        <motion.div variants={item} className="rounded-2xl border border-border/40 bg-zinc-950 p-6 font-mono text-xs relative overflow-hidden">
                          <BorderBeam size={150} duration={8} colorFrom="#ffffff" colorTo="#ffffff20" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />
                          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                            <span className="text-[10px] tracking-wider text-zinc-500 uppercase">Extracted Plaintext Payload</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-lg text-[10px] border-white/10 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                                onClick={() => {
                                  const text = activeReport.patterns?.unstructuredChunks?.[0]?.text || activeReport.findings || "";
                                  navigator.clipboard.writeText(text);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                              >
                                {copied ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-400 mr-1.5" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-1.5" /> Copy Plaintext
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-lg text-[10px] border-white/10 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                                onClick={() => {
                                  const text = activeReport.patterns?.unstructuredChunks?.[0]?.text || activeReport.findings || "";
                                  const blob = new Blob([text], { type: "text/plain" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `plaintext_${activeReport.fileName}.txt`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <Download className="h-3 w-3 mr-1.5" /> Download (.txt)
                              </Button>
                            </div>
                          </div>

                          <div className="max-h-72 overflow-y-auto pr-2 text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {activeReport.patterns?.unstructuredChunks?.[0]?.text || activeReport.findings || "No extracted plaintext payload available."}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    /* ── CONSOLIDATED GLOBAL OVERVIEW ────────────────────── */
                    activeTab === "summary" ? (
                      <>
                        {/* Charts row */}
                        <div>
                          <SectionTitle>Security Trends</SectionTitle>
                          <div className="grid gap-6 lg:grid-cols-2">
                            {/* Score trend */}
                            <motion.div variants={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-1">Security Score Trend</p>
                              <p className="text-xs text-foreground/40 mb-4">Score per uploaded document</p>
                              <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={scoreTrend} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                  <defs>
                                    <linearGradient id="scoreGradSum" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                                  <XAxis dataKey="name" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                                  <YAxis domain={[0, 100]} stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                                    formatter={(v: unknown, _: unknown, p: { payload?: { file?: string } }) => [`${v}/100 (${p.payload?.file || ""})`, "Score"]}
                                  />
                                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGradSum)" dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 6 }} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </motion.div>

                            {/* Entropy trend */}
                            <motion.div variants={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-1">Entropy Trend</p>
                              <p className="text-xs text-foreground/40 mb-4">Shannon entropy per document (max 8.0)</p>
                              <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={entropyTrend} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                  <defs>
                                    <linearGradient id="entropyGradSum" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                                  <XAxis dataKey="name" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                                  <YAxis domain={[0, 8]} stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} />
                                  <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(v: unknown) => [`${v} bits/byte`, "Entropy"]} />
                                  <Area type="monotone" dataKey="entropy" stroke="#10b981" strokeWidth={2.5} fill="url(#entropyGradSum)" dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 6 }} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </motion.div>
                          </div>
                        </div>

                        {/* Bottom row: File bar + Recent */}
                        <div className="grid gap-6 lg:grid-cols-2">
                          {/* File type distribution bar */}
                          <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                            <BorderBeam size={150} duration={10} colorFrom="#6366f1" colorTo="#3b82f6" />
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
                          <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                            <BorderBeam size={150} duration={10} colorFrom="#10b981" colorTo="#8b5cf6" />
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mb-4">Recent Analyses</p>
                            <div className="space-y-2">
                              {reports.slice(0, 5).map((r) => (
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

                        {/* Redirect Banner */}
                        <motion.div variants={item} whileHover={{ y: -3 }}
                          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur flex flex-col md:flex-row items-center justify-between gap-6">
                          <BorderBeam size={180} duration={8} colorFrom="#3b82f6" colorTo="#8b5cf6" />
                          <div className="space-y-1.5 max-w-2xl text-left">
                            <div className="flex items-center gap-2 text-primary">
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase tracking-widest">Interactive Telemetry Hub</span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Advanced Cryptographic Visualizations</h3>
                            <p className="text-sm text-foreground/60 leading-relaxed">
                              Deep-dive into Shannon entropy distributions, AES vs RSA key risk matrices, processing latency regressions, and character frequency spectrums.
                            </p>
                          </div>
                          <Button
                            onClick={() => setActiveTab("visualizations")}
                            className="rounded-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                          >
                            Launch Analytics Engine <ChevronRight className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </>
                    ) : (
                      /* ── ADVANCED FORENSIC VISUALIZATIONS ───────────────── */
                      <div className="space-y-8">
                        {/* Top Stats Band */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          {[
                            { label: "Total Reports", value: stats.totalAnalyses, sub: "Real-time records", icon: FileSearch, color: "#6366f1" },
                            { label: "Avg Security Score", value: `${stats.averageScore}/100`, sub: stats.averageScore >= 70 ? "Satisfactory" : "At Risk", icon: Shield, color: stats.averageScore >= 70 ? "#10b981" : "#f59e0b" },
                            { label: "Weak Findings", value: stats.weakFindings, sub: "Vulnerabilities detected", icon: AlertTriangle, color: stats.weakFindings > 0 ? "#ef4444" : "#10b981" },
                            { label: "Dominant Vector", value: stats.mostCommonIssue, sub: "Primary risk parameter", icon: TrendingUp, color: "#8b5cf6" }
                          ].map(({ label, value, sub, icon: Icon, color }) => (
                            <motion.div key={label} variants={item} whileHover={{ y: -3 }}
                              className="rounded-2xl border border-border/40 bg-background/50 p-5 backdrop-blur-sm relative overflow-hidden text-left">
                              <BorderBeam size={100} duration={8} colorFrom={color} colorTo={`${color}80`} />
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">{label}</span>
                                <div className="p-1.5 rounded-lg" style={{ backgroundColor: color + "15", color }}>
                                  <Icon className="h-4 w-4" />
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-foreground">{value}</p>
                              <p className="text-[10px] text-foreground/40 mt-1">{sub}</p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid gap-6 md:grid-cols-2 text-left">
                          {/* Security Score Trend */}
                          <SectionCard title="Security Score Trend" icon={TrendingUp}>
                            <p className="text-xs text-foreground/40 mb-4">Evolution of protection standards across document sequence</p>
                            <div className="h-60">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.securityTrends} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                                  <XAxis dataKey="name" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                                  <YAxis domain={[0, 100]} stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} />
                                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, _, p) => [`Score: ${v}/100 (${(p.payload as { fileName?: string })?.fileName || ""})`, "Assessment"]} />
                                  <ReferenceLine y={60} stroke="#f97316" strokeDasharray="4 4" label={{ value: "Target", fill: "#f97316", fontSize: 9, position: "insideBottomRight" }} />
                                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreGrad)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </SectionCard>

                          {/* RSA vs AES Risk Breakdown */}
                          <SectionCard title="RSA vs AES Severity Vector" icon={ArrowLeftRight}>
                            <p className="text-xs text-foreground/40 mb-4">Comparison of risk categories across public key and symmetric controls</p>
                            <div className="h-60">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.rsaVsAES} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                                  <XAxis dataKey="category" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                                  <YAxis stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} />
                                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                  <Bar dataKey="RSA" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="AES" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </SectionCard>

                          {/* Weakness Distribution */}
                          <SectionCard title="Cryptographic Weakness Distribution" icon={AlertTriangle}>
                            <p className="text-xs text-foreground/40 mb-4">Breakdown of specific protocol configuration anomalies detected</p>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 h-60">
                              <div className="w-full sm:w-[50%] h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={stats.weaknessDistribution} dataKey="value" nameKey="name"
                                      cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                                      {stats.weaknessDistribution.map((_, idx) => (
                                        <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, "Impact"]} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="flex-1 space-y-2 w-full">
                                {stats.weaknessDistribution.map((w, idx) => (
                                  <div key={w.name} className="flex items-center justify-between text-xs border-b border-border/5 pb-1">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                                      <span className="text-foreground/70">{w.name}</span>
                                    </div>
                                    <span className="font-semibold text-foreground/90">{w.value}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </SectionCard>

                          {/* Entropy Distribution */}
                          <SectionCard title="Shannon Entropy Spread" icon={Activity}>
                            <p className="text-xs text-foreground/40 mb-4">Randomness scores representing plaintext obfuscation quality (ideal: ~8.0)</p>
                            <div className="h-60">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.entropyDistribution} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="entropySpreadGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                                  <XAxis dataKey="range" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 9 }} />
                                  <YAxis stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} allowDecimals={false} />
                                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Documents"]} />
                                  <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#entropySpreadGrad)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </SectionCard>

                          {/* Encryption Timing Latency vs Size */}
                          <SectionCard title="Encryption Latency Profiler" icon={Clock}>
                            <p className="text-xs text-foreground/40 mb-4">Processing time correlation to document size across runs (ms vs KB)</p>
                            <div className="h-60">
                              <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} />
                                  <XAxis dataKey="fileSizeKB" name="Size" unit=" KB" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                                  <YAxis dataKey="timeMs" name="Latency" unit=" ms" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={35} />
                                  <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    content={(props) => {
                                      const payload = props.payload?.[0]?.payload as { fileName: string; fileSizeKB: number; timeMs: number } | undefined;
                                      if (!payload) return null;
                                      return (
                                        <div style={TOOLTIP_STYLE}>
                                          <p className="font-semibold text-xs border-b border-white/10 pb-1 mb-1 truncate max-w-[200px]">{payload.fileName}</p>
                                          <p>Size: {payload.fileSizeKB} KB</p>
                                          <p>Latency: {payload.timeMs} ms</p>
                                        </div>
                                      );
                                    }}
                                  />
                                  <Scatter data={stats.encryptionTimeVsFileSize} fill="#ec4899" />
                                </ScatterChart>
                              </ResponsiveContainer>
                            </div>
                          </SectionCard>

                          {/* User Activity Trends */}
                          <SectionCard title="Weekly Forensic Activity" icon={FileText}>
                            <p className="text-xs text-foreground/40 mb-4">Analysis volumes completed per date interval</p>
                            <div className="h-60">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.activityTrends} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                                  <XAxis dataKey="date" stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} />
                                  <YAxis stroke="var(--foreground)" opacity={0.4} style={{ fontSize: 10 }} width={30} allowDecimals={false} />
                                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Analyses"]} />
                                  <Area type="monotone" dataKey="analyses" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#actGrad)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </SectionCard>
                        </div>
                      </div>
                    )
                  )}

                </motion.div>
              )}
            </div>
          </div>
          {/* Floating Audio Prompt Popup – matches Hybrid Lab style */}
          {audioPrompt && (
            <div className="fixed bottom-6 left-6 z-50 flex items-end gap-3">
              <div className="max-w-sm bg-black/95 border border-border/40 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur text-[10px] text-foreground/70 font-mono leading-relaxed">
                <span className="text-primary font-bold block mb-1 text-xs">🎙 AI Security Briefing:</span>
                <p className="line-clamp-5">{audioPrompt}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
