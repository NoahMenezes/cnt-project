"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, X, AlertTriangle, CheckCircle, Shield,
  Clock, ChevronRight, Copy, BarChart2, Lock, Zap, Search,
  TrendingUp, AlertCircle, Info
} from "lucide-react";
import {
  ResponsiveContainer, RadialBarChart, RadialBar, Cell,
  Tooltip
} from "recharts";
import analysisData from "./data/analysisResults";
import Link from "next/link";

const SUPPORTED_FORMATS = [".txt", ".pdf", ".docx", ".json", ".csv"];

function validateFile(file: File) {
  const ext = "." + file.name.split(".").pop()!.toLowerCase();
  if (!SUPPORTED_FORMATS.includes(ext))
    return { valid: false, error: `Unsupported: ${ext}. Supported: ${SUPPORTED_FORMATS.join(", ")}` };
  if (file.size > 10 * 1024 * 1024)
    return { valid: false, error: "File exceeds 10 MB limit." };
  return { valid: true };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileCategory(ext: string) {
  const map: Record<string, string> = {
    ".txt": "Text Document", ".pdf": "PDF Document",
    ".docx": "Word Document", ".json": "JSON Data", ".csv": "Spreadsheet",
  };
  return map[ext] || "Unknown";
}

function scoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Secure";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Weak";
  return "Critical";
}

function priorityColor(p: string) {
  if (p === "Critical") return "bg-red-500/20 text-red-400 border-red-500/30";
  if (p === "High") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (p === "Medium") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-blue-500/20 text-blue-400 border-blue-500/30";
}

function statusColor(status: string) {
  if (status === "Secure") return "bg-emerald-500/20 text-emerald-400";
  if (status === "Moderate") return "bg-yellow-500/20 text-yellow-400";
  if (status === "Weak") return "bg-orange-500/20 text-orange-400";
  return "bg-red-500/20 text-red-400";
}

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const data = [{ value: score }, { value: 100 - score }];
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" startAngle={90} endAngle={-270} data={[{ value: score }]}>
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "rgba(255,255,255,0.05)" }}>
            <Cell fill={color} />
          </RadialBar>
          <Tooltip formatter={(v) => [`${v}/100`, "Score"]} contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-foreground/50 uppercase tracking-widest">/ 100</span>
      </div>
      {data && null}
    </div>
  );
}

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-6 space-y-4 animate-pulse">
      <div className="h-4 w-1/3 rounded bg-foreground/10" />
      <div className="h-8 w-1/2 rounded bg-foreground/10" />
      <div className="h-3 w-full rounded bg-foreground/10" />
      <div className="h-3 w-3/4 rounded bg-foreground/10" />
    </div>
  );
}

export default function AnalyzePage() {
  const navData = [
    { title: "Home", href: "/" },
    { title: "Dashboard", href: "/dashboard" },
    { title: "Analyze", href: "/analyze", isActive: true },
    { title: "Hybrid Lab", href: "/hybrid-lab" },
    { title: "Visualizations", href: "/visualizations" },
    { title: "Reports", href: "/reports" },
    { title: "Profile", href: "/profile" },
  ];

  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const result = analysisData.currentAnalysis;
  const recent = analysisData.recentAnalyses;

  const handleFile = useCallback((file: File) => {
    const v = validateFile(file);
    if (!v.valid) { setFileError(v.error!); return; }
    setFileError("");
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    const iv = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(iv); setIsUploading(false); return 100; }
        return p + 10;
      });
    }, 150);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const runAnalysis = useCallback(() => {
    if (!uploadedFile && !textInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setTimeout(() => { setIsAnalyzing(false); setAnalysisComplete(true); }, 2200);
  }, [uploadedFile, textInput]);

  const clearAll = useCallback(() => {
    setUploadedFile(null); setTextInput(""); setUploadProgress(0);
    setAnalysisComplete(false); setIsAnalyzing(false); setFileError("");
  }, []);

  const canAnalyze = (!!uploadedFile || textInput.trim().length > 0) && !isUploading && !isAnalyzing;

  return (
    <div className="relative min-h-screen bg-background">
      <Header navigationData={navData} />
      <div className="pt-20">
        <main className="relative min-h-[calc(100vh-80px)] bg-background">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/[0.03] blur-[140px]" />
            <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-foreground/[0.02] blur-[120px]" />
          </div>

          <div className="relative px-6 py-8 lg:py-12">
            <div className="mx-auto max-w-7xl space-y-8">

              {/* Page Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge variant="outline" className="mb-4 inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
                  <Search className="h-3.5 w-3.5" /> Cryptographic Analysis
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Analyze Encryption</h1>
                <p className="mt-2 text-foreground/60 max-w-2xl">Upload a file or paste encrypted text to receive a comprehensive multi-dimensional security report covering entropy, RSA/AES weaknesses, and pattern detection.</p>
              </motion.div>

              {/* Input Section */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                {/* Tab Switcher */}
                <div className="flex gap-1 mb-6 w-fit rounded-lg bg-muted/50 p-1">
                  {(["file", "text"] as const).map((m) => (
                    <button key={m} onClick={() => setInputMode(m)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === m ? "bg-background text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
                      {m === "file" ? "File Upload" : "Paste Text"}
                    </button>
                  ))}
                </div>

                {inputMode === "file" ? (
                  <div>
                    {!uploadedFile ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/70 hover:bg-foreground/[0.02]"}`}>
                        <Upload className={`h-10 w-10 transition-colors ${isDragging ? "text-primary" : "text-foreground/30"}`} />
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{isDragging ? "Release to upload" : "Drag and drop your encrypted file here"}</p>
                          <p className="mt-1 text-xs text-foreground/40">{SUPPORTED_FORMATS.join(", ")} · Max 10 MB</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-full">Browse Files</Button>
                        {fileError && <p className="text-xs text-red-400 mt-2">{fileError}</p>}
                        <input ref={fileInputRef} type="file" className="hidden" accept={SUPPORTED_FORMATS.join(",")}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isUploading && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-foreground/50">
                              <span>Uploading…</span><span>{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        )}
                        {!isUploading && (
                          <div className="rounded-xl border border-border/40 bg-background/40 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-start gap-3 col-span-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{uploadedFile.name}</p>
                                <p className="text-xs text-foreground/50">{formatFileSize(uploadedFile.size)}</p>
                              </div>
                              <button onClick={() => setUploadedFile(null)} className="ml-auto text-foreground/30 hover:text-foreground/70 transition-colors">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {[
                              ["Category", getFileCategory("." + uploadedFile.name.split(".").pop()!.toLowerCase())],
                              ["Extension", "." + uploadedFile.name.split(".").pop()!.toLowerCase()],
                              ["Upload Date", new Date().toLocaleDateString()],
                              ["Upload Time", new Date().toLocaleTimeString()],
                            ].map(([k, v]) => (
                              <div key={k}>
                                <p className="text-xs uppercase tracking-widest text-foreground/40">{k}</p>
                                <p className="text-sm font-medium text-foreground mt-0.5">{v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste your encrypted text, ciphertext, PEM key, or Base64-encoded data here for analysis..."
                      className="w-full min-h-[200px] resize-y rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    />
                    <span className="absolute bottom-3 right-3 text-xs text-foreground/30">{textInput.length} chars</span>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <Button onClick={runAnalysis} disabled={!canAnalyze} className="rounded-full gap-2">
                    <Zap className="h-4 w-4" />{isAnalyzing ? "Analyzing…" : "Analyze"}
                  </Button>
                  <Button onClick={clearAll} variant="outline" className="rounded-full">Clear</Button>
                </div>
              </motion.div>

              {/* Results */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {analysisComplete && (
                  <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">Analysis Results</h2>
                      <div className="h-px flex-1 bg-border/40" />
                      <Badge variant="outline" className="text-xs gap-1"><CheckCircle className="h-3 w-3 text-emerald-400" />Complete</Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                      {/* Security Score */}
                      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur col-span-1 flex flex-col items-center gap-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40 w-full">Security Score</p>
                        <ScoreGauge score={result.securityScore.overall} />
                        <div className="w-full space-y-2">
                          <span className="text-sm font-bold" style={{ color: scoreColor(result.securityScore.overall) }}>
                            {scoreLabel(result.securityScore.overall)}
                          </span>
                          {Object.entries(result.securityScore.breakdown).map(([k, v]) => (
                            <div key={k} className="space-y-1">
                              <div className="flex justify-between text-xs text-foreground/40">
                                <span className="capitalize">{k.replace("Score", "")}</span><span>{v}</span>
                              </div>
                              <MiniBar value={v} color={scoreColor(v)} />
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Entropy */}
                      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Entropy</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{result.entropy.classification}</span>
                        </div>
                        <p className="text-4xl font-bold text-foreground">{result.entropy.value} <span className="text-lg text-foreground/40">/ 8.00</span></p>
                        <MiniBar value={result.entropy.value} max={8} color="#10b981" />
                        <div className="flex items-center gap-2">
                          <BarChart2 className="h-3.5 w-3.5 text-foreground/40" />
                          <span className="text-xs text-foreground/40">Randomness: {result.entropy.randomnessScore}%</span>
                        </div>
                        <p className="text-xs text-foreground/60 leading-relaxed">{result.entropy.interpretation}</p>
                      </motion.div>

                      {/* RSA */}
                      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">RSA Analysis</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{result.rsa.riskLevel}</span>
                        </div>
                        <p className="text-4xl font-bold text-foreground">{result.rsa.keySize} <span className="text-lg text-foreground/40">bits</span></p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-foreground/40">Exponent</span><span className="text-foreground font-mono">e = {result.rsa.publicExponent}</span></div>
                          <div className="flex justify-between"><span className="text-foreground/40">Modulus</span><span className="text-foreground/70 truncate max-w-[120px]">{result.rsa.modulusInfo.slice(0, 30)}…</span></div>
                        </div>
                        <div className="space-y-1.5">
                          {result.rsa.vulnerabilities.map((v, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{v}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* AES */}
                      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">AES Analysis</p>
                        <div className="grid grid-cols-3 gap-3">
                          {[["Key", result.aes.keyStrength], ["Mode", result.aes.encryptionMode], ["Password", result.aes.passwordComplexity]].map(([k, v]) => (
                            <div key={k} className="rounded-lg bg-foreground/[0.04] p-2 text-center">
                              <p className="text-xs text-foreground/40">{k}</p>
                              <p className="text-sm font-semibold text-foreground">{v}</p>
                            </div>
                          ))}
                        </div>
                        <ul className="space-y-1.5">
                          {result.aes.securityRecommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-foreground/60">
                              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-400" /><span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>

                      {/* Patterns */}
                      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Pattern Detection</p>
                        <div className="space-y-3">
                          {[
                            ["Repeated Characters", result.patterns.repeatedCharacters],
                            ["Block Repetition", result.patterns.blockRepetition],
                            ["Repeated Sequences", result.patterns.repeatedSequences.length > 0],
                          ].map(([label, val]) => (
                            <div key={String(label)} className="flex items-center justify-between">
                              <span className="text-sm text-foreground/70">{String(label)}</span>
                              {val ? <AlertCircle className="h-4 w-4 text-red-400" /> : <CheckCircle className="h-4 w-4 text-emerald-400" />}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-foreground/60 leading-relaxed">{result.patterns.observations}</p>
                      </motion.div>

                      {/* Recommendations */}
                      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Recommendations</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {result.recommendations.map((r, i) => (
                            <div key={i} className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${priorityColor(r.priority)}`}>
                              <span className="text-xs font-semibold shrink-0">{r.priority}</span>
                              <span className="text-xs leading-relaxed">{r.action}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recent Analyses */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground">Recent Analyses</p>
                  <Link href="/reports"><Button variant="ghost" size="sm" className="text-xs gap-1 text-foreground/50 hover:text-foreground">View All <ChevronRight className="h-3 w-3" /></Button></Link>
                </div>
                <div className="space-y-2">
                  {recent.map((item) => (
                    <Link key={item.id} href={`/reports/${item.id}`}>
                      <div className="flex items-center gap-4 rounded-lg border border-border/20 bg-background/40 px-4 py-3 hover:border-border/40 hover:bg-background/60 transition-all cursor-pointer">
                        <FileText className="h-4 w-4 text-foreground/40 shrink-0" />
                        <span className="text-sm text-foreground flex-1 truncate">{item.fileName}</span>
                        <span className="text-xs text-foreground/40">{item.date}</span>
                        <span className="text-sm font-bold" style={{ color: scoreColor(item.score) }}>{item.score}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(item.status)}`}>{item.status}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-foreground/30" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
