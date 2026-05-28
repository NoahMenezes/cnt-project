"use client";

import React, { useState, useMemo, useCallback } from "react";
import Header from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, ChevronUp, ChevronDown, Eye, Download, Trash2,
  X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, FileSearch,
  AlertCircle, Info, Shield
} from "lucide-react";
import { getReports, deleteReport as deleteReportFromStore, Report } from "@/lib/store";
import { useEffect } from "react";
import Link from "next/link";

const NAV = [
  { title: "Home", href: "/" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Analyze", href: "/analyze" },
  { title: "Hybrid Lab", href: "/hybrid-lab" },
  { title: "Visualizations", href: "/visualizations" },
  { title: "Reports", href: "/reports", isActive: true },
  { title: "Learn", href: "/learn" },
  { title: "Profile", href: "/profile" },
];

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-400"; if (s >= 60) return "text-yellow-400";
  if (s >= 40) return "text-orange-400"; return "text-red-400";
}
function scoreBarColor(s: number) {
  if (s >= 80) return "#10b981"; if (s >= 60) return "#f59e0b";
  if (s >= 40) return "#f97316"; return "#ef4444";
}
function statusStyle(st: string) {
  if (st === "Secure") return "bg-emerald-500/20 text-emerald-400";
  if (st === "Moderate") return "bg-yellow-500/20 text-yellow-400";
  if (st === "Weak") return "bg-orange-500/20 text-orange-400";
  return "bg-red-500/20 text-red-400";
}
function typeStyle(t: string) {
  return "bg-foreground/10 text-foreground/60 border border-border/30";
}

function ScoreMiniBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}</span>
      <div className="h-1.5 w-16 rounded-full bg-foreground/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreBarColor(score) }} />
      </div>
    </div>
  );
}

function DetailPanel({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className="rounded-2xl border border-border/40 bg-background/80 backdrop-blur p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">{report.fileName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(report.status)}`}>{report.status}</span>
          </div>
          <p className="text-xs text-foreground/40">{new Date(report.analysisDate).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className={`text-3xl font-bold ${scoreColor(report.securityScore)}`}>{report.securityScore}</p>
            <p className="text-xs text-foreground/40">/ 100</p>
          </div>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="text-sm text-foreground/70 leading-relaxed border-l-2 border-primary/40 pl-3">{report.findings}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/30 bg-foreground/[0.02] p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Entropy</p>
          <p className="text-2xl font-bold text-foreground">{report.entropy.value}</p>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{report.entropy.classification}</span>
            <span className="text-xs text-foreground/40">{report.entropy.randomnessScore}% randomness</span>
          </div>
        </div>
        <div className="rounded-xl border border-border/30 bg-foreground/[0.02] p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">RSA</p>
          <p className="text-2xl font-bold text-foreground">{report.rsa.keySize} <span className="text-base text-foreground/40">bits</span></p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/40">Exponent: e={report.rsa.exponent}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${report.rsa.riskLevel === "Low" ? "bg-emerald-500/20 text-emerald-400" : report.rsa.riskLevel === "High" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"}`}>{report.rsa.riskLevel}</span>
          </div>
          {report.rsa.vulnerabilities.length > 0 && (
            <ul className="space-y-1">
              {report.rsa.vulnerabilities.map((v, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{v}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border/30 bg-foreground/[0.02] p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">AES</p>
          <p className="text-2xl font-bold text-foreground">{report.aes.keyStrength}</p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/60">{report.aes.mode}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/60">{report.aes.passwordComplexity}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3">Recommendations</p>
        <div className="space-y-2">
          {report.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/70">
              <Info className="h-4 w-4 text-primary/60 shrink-0 mt-0.5" />
              <span>{r.action}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Link href="/analyze"><Button size="sm" variant="outline" className="rounded-full text-xs gap-1"><Search className="h-3 w-3" />Reanalyze</Button></Link>
        <Button size="sm" variant="ghost" className="rounded-full text-xs gap-1" onClick={() => {
          const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${report.id}.json`; a.click();
        }}><Download className="h-3 w-3" />Download</Button>
      </div>
    </motion.div>
  );
}

const PER_PAGE = 5;

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setReports(getReports());

    // Auto-open detailed report if query param ?id=rpt-xxx is set
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get("id");
      if (queryId) {
        const found = getReports().find((r) => r.id === queryId);
        if (found) {
          setSelectedReport(found);
        }
      }
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"analysisDate" | "securityScore" | "fileName">("analysisDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = [...reports];
    if (searchQuery) r = r.filter(x => x.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== "all") r = r.filter(x => x.status === statusFilter);
    r.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "securityScore") return (a.securityScore - b.securityScore) * dir;
      if (sortField === "fileName") return a.fileName.localeCompare(b.fileName) * dir;
      return (new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime()) * dir;
    });
    return r;
  }, [reports, searchQuery, sortField, sortDir, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const toggleSort = useCallback((field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setCurrentPage(1);
  }, [sortField]);

  const deleteReport = useCallback((id: string) => {
    deleteReportFromStore(id);
    setReports(getReports());
    if (selectedReport?.id === id) setSelectedReport(null);
    setDeletingId(null);
  }, [selectedReport]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

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

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge variant="outline" className="mb-4 inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
                  <FileText className="h-3.5 w-3.5" /> Analysis Archive
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Reports</h1>
                <p className="mt-2 text-foreground/60 max-w-2xl">A searchable, sortable archive of all past analysis reports with detailed findings and recommendations.</p>
              </motion.div>

              {/* Filter Bar */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                  <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search by file name…"
                    className="w-full rounded-full border border-border/40 bg-background/60 pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur" />
                </div>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="rounded-full border border-border/40 bg-background/60 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 backdrop-blur">
                  {["all", "Secure", "Moderate", "Weak", "Critical"].map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
                </select>
                <select value={sortField} onChange={e => { setSortField(e.target.value as typeof sortField); setCurrentPage(1); }}
                  className="rounded-full border border-border/40 bg-background/60 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 backdrop-blur">
                  <option value="analysisDate">Date</option>
                  <option value="securityScore">Security Score</option>
                  <option value="fileName">File Name</option>
                </select>
                <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                  className="flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-3 py-2 text-xs text-foreground/50 hover:text-foreground transition-colors backdrop-blur">
                  {sortDir === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                  {sortDir === "desc" ? "Newest first" : "Oldest first"}
                </button>
              </motion.div>

              {/* Table */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur overflow-hidden">
                {paged.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-20">
                    <FileSearch className="h-12 w-12 text-foreground/20" />
                    <p className="text-sm text-foreground/40">No reports found matching your filters.</p>
                    <Link href="/analyze"><Button size="sm" variant="outline" className="rounded-full">Run Your First Analysis</Button></Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/30">
                          {[
                            { label: "File Name", field: "fileName" as const },
                            { label: "Type", field: null },
                            { label: "Date", field: "analysisDate" as const },
                            { label: "Score", field: "securityScore" as const },
                            { label: "Status", field: null },
                            { label: "Actions", field: null },
                          ].map(col => (
                            <th key={col.label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40">
                              {col.field ? (
                                <button onClick={() => toggleSort(col.field!)} className="flex items-center gap-1 hover:text-foreground/70 transition-colors">
                                  {col.label} <SortIcon field={col.field} />
                                </button>
                              ) : col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {paged.map((r) => (
                          <React.Fragment key={r.id}>
                            <tr className={`hover:bg-foreground/[0.02] transition-colors ${selectedReport?.id === r.id ? "bg-primary/[0.04]" : ""}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-foreground/30 shrink-0" />
                                  <span className="text-sm text-foreground font-medium">{r.fileName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded font-mono ${typeStyle(r.type)}`}>{r.type}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground/50">
                                {new Date(r.analysisDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="px-4 py-3"><ScoreMiniBar score={r.securityScore} /></td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(r.status)}`}>{r.status}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setSelectedReport(selectedReport?.id === r.id ? null : r)}
                                    className={`p-1.5 rounded-lg transition-colors ${selectedReport?.id === r.id ? "text-primary bg-primary/10" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"}`}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => {
                                    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
                                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${r.id}.json`; a.click();
                                  }} className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors">
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                  {deletingId === r.id ? (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => deleteReport(r.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors">Delete</button>
                                      <button onClick={() => setDeletingId(null)} className="text-xs text-foreground/40 hover:text-foreground/70 px-2 py-1 rounded transition-colors">Cancel</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => setDeletingId(r.id)} className="p-1.5 rounded-lg text-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/40 text-xs">Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length} reports</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-border/40 text-foreground/40 hover:text-foreground disabled:opacity-30 transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setCurrentPage(p)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${currentPage === p ? "bg-primary text-primary-foreground" : "border border-border/40 text-foreground/40 hover:text-foreground"}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-border/40 text-foreground/40 hover:text-foreground disabled:opacity-30 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Detail Panel */}
              <AnimatePresence>
                {selectedReport && (
                  <DetailPanel report={selectedReport} onClose={() => setSelectedReport(null)} />
                )}
              </AnimatePresence>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
