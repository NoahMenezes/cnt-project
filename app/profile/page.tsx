"use client";

import React, { useState, useCallback } from "react";
import Header from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Calendar, Camera, Pencil, Check, X,
  Eye, EyeOff, Lock, Bell, Shield, Monitor, Clock,
  Search, Layers, FileText, Activity, TrendingUp, Zap
} from "lucide-react";
import profileRaw from "./data/profileData";
import { getReports, getStats } from "@/lib/store";
import { useEffect } from "react";

const NAV = [
  { title: "Home", href: "/" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Operation Lab", href: "/analyze" },
  { title: "Hybrid Lab", href: "/hybrid-lab" },
  { title: "Reports", href: "/reports" },
  { title: "Key Vault", href: "/vault" },
  { title: "Visualizations", href: "/visualizations" },
  { title: "Profile", href: "/profile", isActive: true },
];

const ACT_ICONS: Record<string, React.ElementType> = {
  analysis: Search, report: FileText, hybrid: Layers, settings: Lock, eye: Eye,
};

function relativeTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "lg" ? "h-20 w-20 text-2xl" : "h-8 w-8 text-xs";
  return (
    <div className={`${sz} rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border-2 border-primary/30`}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur p-5 flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-foreground/40">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-foreground/30">All time</p>
      </div>
    </motion.div>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-emerald-500"];
  const labels = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-foreground/10"}`} />
        ))}
      </div>
      {password && <p className={`text-xs ${score < 3 ? "text-red-400" : score < 5 ? "text-yellow-400" : "text-emerald-400"}`}>{labels[score]}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState({
    name: profileRaw.user.name,
    email: profileRaw.user.email,
    joinDate: profileRaw.user.joinDate,
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPass: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ currentPass: false, newPass: false, confirm: false });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [notifPrefs, setNotifPrefs] = useState({ emailOnAnalysis: true, weeklyReport: false, securityAlerts: true });
  const [secPrefs, setSecPrefs] = useState({ autoDelete: false, maxAge: 90, defaultKeySize: "2048", warnWeak: true });

  const [profileStats, setProfileStats] = useState({
    totalAnalyses: 0,
    averageScore: 0,
    reportsGenerated: 0,
    filesProcessed: 0
  });

  const [recentActivityList, setRecentActivityList] = useState<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }[]>([]);

  useEffect(() => {
    const refreshData = () => {
      const s = getStats();
      setProfileStats({
        totalAnalyses: s.totalFiles,
        averageScore: Math.round(s.avgSecurityScore),
        reportsGenerated: s.totalFiles,
        filesProcessed: s.totalFiles
      });

      const reports = getReports().slice(0, 4);
      setRecentActivityList(reports.map(r => ({
        id: r.id,
        type: "analysis",
        description: `Analyzed file: ${r.fileName}`,
        timestamp: r.analysisDate
      })));
    };

    refreshData();

    window.addEventListener("cipher_scope_db_update", refreshData);
    return () => window.removeEventListener("cipher_scope_db_update", refreshData);
  }, []);

  const sessions = profileRaw.sessions;
  const activity = recentActivityList;
  const stats = profileStats;

  const startEditName = () => { setEditedName(userInfo.name); setIsEditingName(true); };
  const saveName = () => { if (editedName.trim()) setUserInfo(u => ({ ...u, name: editedName.trim() })); setIsEditingName(false); };

  const validatePassword = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!passwordForm.currentPass) errs.currentPass = "Required";
    if (passwordForm.newPass.length < 12) errs.newPass = "Must be at least 12 characters";
    if (passwordForm.newPass !== passwordForm.confirm) errs.confirm = "Passwords do not match";
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  }, [passwordForm]);

  const submitPassword = useCallback(async () => {
    if (!validatePassword()) return;
    setIsUpdatingPassword(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsUpdatingPassword(false);
    setPasswordSuccess(true);
    setPasswordForm({ currentPass: "", newPass: "", confirm: "" });
    setTimeout(() => setPasswordSuccess(false), 3000);
  }, [validatePassword]);

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

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge variant="outline" className="mb-4 inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
                  <User className="h-3.5 w-3.5" /> Account
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Profile</h1>
              </motion.div>

              <div className="grid gap-6 lg:grid-cols-2">

                {/* Left Column */}
                <div className="space-y-5">

                  {/* User Info Card */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur p-6 space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar name={userInfo.name} size="lg" />
                        <button className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <Camera className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {isEditingName ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input value={editedName} onChange={e => setEditedName(e.target.value)}
                                className="flex-1 rounded-lg border border-primary/40 bg-background/40 px-2 py-1 text-sm text-foreground focus:outline-none" />
                              <button onClick={saveName} className="text-emerald-400 hover:text-emerald-300"><Check className="h-4 w-4" /></button>
                              <button onClick={() => setIsEditingName(false)} className="text-foreground/40 hover:text-foreground/70"><X className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <>
                              <p className="text-lg font-bold text-foreground">{userInfo.name}</p>
                              <button onClick={startEditName} className="text-foreground/30 hover:text-foreground/70 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground/50">
                          <Mail className="h-3.5 w-3.5" />{userInfo.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/40">
                          <Calendar className="h-3 w-3" />
                          Member since {new Date(userInfo.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Total Analyses" value={stats.totalAnalyses} icon={Search} />
                    <StatCard label="Avg Score" value={stats.averageScore} icon={TrendingUp} />
                    <StatCard label="Reports" value={stats.reportsGenerated} icon={FileText} />
                    <StatCard label="Files Processed" value={stats.filesProcessed} icon={Zap} />
                  </div>

                  {/* Session History */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-foreground/40" />
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Session History</p>
                    </div>
                    <div className="space-y-1">
                      {sessions.map((s, i) => (
                        <div key={s.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${i === 0 ? "bg-primary/5 border border-primary/20" : "border border-border/20"}`}>
                          <div className={`h-2 w-2 rounded-full shrink-0 ${s.status === "Active" ? "bg-emerald-400" : "bg-foreground/20"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground/70 truncate">{s.device}</p>
                            <p className="text-foreground/30">{s.ip}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-medium ${s.status === "Active" ? "text-emerald-400" : "text-foreground/30"}`}>{s.status}</p>
                            <p className="text-foreground/30">{new Date(s.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">

                  {/* Password Update */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-foreground/40" />
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Update Password</p>
                    </div>
                    <AnimatePresence>
                      {passwordSuccess && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                          <Check className="h-3.5 w-3.5" />Password updated successfully
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="space-y-3">
                      {(["currentPass", "newPass", "confirm"] as const).map(field => {
                        const labels = { currentPass: "Current Password", newPass: "New Password", confirm: "Confirm New Password" };
                        return (
                          <div key={field}>
                            <label className="text-xs text-foreground/40 block mb-1">{labels[field]}</label>
                            <div className="relative">
                              <input
                                type={showPass[field] ? "text" : "password"}
                                value={passwordForm[field]}
                                onChange={e => setPasswordForm(f => ({ ...f, [field]: e.target.value }))}
                                className={`w-full rounded-lg border bg-background/40 px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all ${passwordErrors[field] ? "border-red-500/50" : "border-border/40"}`}
                              />
                              <button onClick={() => setShowPass(s => ({ ...s, [field]: !s[field] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors">
                                {showPass[field] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                            {field === "newPass" && passwordForm.newPass && <div className="mt-2"><PasswordStrengthBar password={passwordForm.newPass} /></div>}
                            {passwordErrors[field] && <p className="text-xs text-red-400 mt-1">{passwordErrors[field]}</p>}
                          </div>
                        );
                      })}
                    </div>
                    <Button onClick={submitPassword} disabled={isUpdatingPassword} size="sm" className="rounded-full gap-2">
                      <Lock className="h-3.5 w-3.5" />{isUpdatingPassword ? "Updating…" : "Update Password"}
                    </Button>
                  </motion.div>

                  {/* Notification Preferences */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-foreground/40" />
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Notifications</p>
                    </div>
                    <div className="space-y-3">
                      {([
                        ["emailOnAnalysis", "Email after each analysis"],
                        ["weeklyReport", "Weekly summary email"],
                        ["securityAlerts", "Security alerts for critical findings"],
                      ] as const).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-foreground/70">{label}</span>
                          <button onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}
                            className={`relative h-5 w-9 rounded-full transition-colors ${notifPrefs[key] ? "bg-primary" : "bg-foreground/20"}`}>
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${notifPrefs[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Security Preferences */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-foreground/40" />
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Security Preferences</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground/70">Warn on weak configurations</span>
                        <button onClick={() => setSecPrefs(p => ({ ...p, warnWeak: !p.warnWeak }))}
                          className={`relative h-5 w-9 rounded-full transition-colors ${secPrefs.warnWeak ? "bg-primary" : "bg-foreground/20"}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${secPrefs.warnWeak ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground/70">Auto-delete old reports</span>
                        <button onClick={() => setSecPrefs(p => ({ ...p, autoDelete: !p.autoDelete }))}
                          className={`relative h-5 w-9 rounded-full transition-colors ${secPrefs.autoDelete ? "bg-primary" : "bg-foreground/20"}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${secPrefs.autoDelete ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                      {secPrefs.autoDelete && (
                        <div className="flex items-center gap-3 pl-2">
                          <label className="text-xs text-foreground/40 shrink-0">Delete after</label>
                          <input type="number" value={secPrefs.maxAge} onChange={e => setSecPrefs(p => ({ ...p, maxAge: +e.target.value }))}
                            className="w-20 rounded-lg border border-border/40 bg-background/40 px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                          <span className="text-xs text-foreground/40">days</span>
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-foreground/40 block mb-1">Default RSA Key Size</label>
                        <select value={secPrefs.defaultKeySize} onChange={e => setSecPrefs(p => ({ ...p, defaultKeySize: e.target.value }))}
                          className="w-full rounded-lg border border-border/40 bg-background/40 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50">
                          {["1024", "2048", "4096"].map(s => <option key={s} value={s}>{s}-bit</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recent Activity */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-foreground/40" />
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Recent Activity</p>
                    </div>
                    <div className="space-y-2">
                      {activity.map((a) => {
                        const Icon = ACT_ICONS[a.type] || Activity;
                        return (
                          <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border/20 bg-background/30 px-3 py-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-xs text-foreground/70 flex-1">{a.description}</p>
                            <span className="text-xs text-foreground/30 shrink-0 flex items-center gap-1">
                              <Clock className="h-3 w-3" />{relativeTime(a.timestamp)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
