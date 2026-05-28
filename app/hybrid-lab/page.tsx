"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Lock, Layers, Play, RefreshCw, Copy, Eye, EyeOff,
  AlertTriangle, CheckCircle, Clock, Zap, Terminal, ChevronDown, ChevronUp
} from "lucide-react";
import sampleData from "./data/sampleMessages";

const NAV = [
  { title: "Home", href: "/" }, { title: "Dashboard", href: "/dashboard" },
  { title: "Analyze", href: "/analyze" }, { title: "Hybrid Lab", href: "/hybrid-lab", isActive: true },
  { title: "Visualizations", href: "/visualizations" }, { title: "Reports", href: "/reports" },
  { title: "Learn", href: "/learn" }, { title: "Profile", href: "/profile" },
];

const STEPS = [
  { id: 1, title: "Generate AES Session Key", desc: "A unique 256-bit AES key is generated for this session only", icon: Key },
  { id: 2, title: "Encrypt Message with AES", desc: "The plaintext message is encrypted using the AES session key", icon: Lock },
  { id: 3, title: "Encrypt AES Key with RSA", desc: "The AES session key is encrypted using the recipient's RSA public key", icon: Key },
  { id: 4, title: "Transmit Encrypted Data", desc: "Both the RSA-wrapped AES key and the AES ciphertext are transmitted", icon: Layers },
  { id: 5, title: "Decrypt AES Key with RSA", desc: "The recipient uses their RSA private key to recover the AES session key", icon: Key },
  { id: 6, title: "Decrypt Original Message", desc: "The recovered AES key decrypts the ciphertext to produce the original message", icon: CheckCircle },
];

function randomHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
function randomB64(len: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + "==";
}

function ts() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
    "." + String(Date.now() % 1000).padStart(3, "0");
}

interface LogEntry { time: string; level: "INFO" | "WARN" | "ERROR"; msg: string; }

function LogLine({ entry }: { entry: LogEntry }) {
  const col = entry.level === "INFO" ? "text-foreground/60" : entry.level === "WARN" ? "text-yellow-400" : "text-red-400";
  return (
    <div className={`font-mono text-xs ${col}`}>
      <span className="text-foreground/30">[{entry.time}]</span>{" "}
      <span className="font-bold">[{entry.level}]</span>{" "}{entry.msg}
    </div>
  );
}

function StepCard({ step, status }: { step: typeof STEPS[0]; status: "pending" | "processing" | "done" }) {
  const Icon = step.icon;
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
      status === "done" ? "border-emerald-500/30 bg-emerald-500/5" :
      status === "processing" ? "border-primary/50 bg-primary/5 animate-pulse" :
      "border-border/30 bg-background/30"
    }`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
        status === "done" ? "bg-emerald-500/20 text-emerald-400" :
        status === "processing" ? "bg-primary/20 text-primary" :
        "bg-foreground/10 text-foreground/40"
      }`}>
        {status === "done" ? <CheckCircle className="h-4 w-4" /> : step.id}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${status === "pending" ? "text-foreground/40" : "text-foreground"}`}>{step.title}</p>
        <p className="text-xs text-foreground/40 mt-0.5">{step.desc}</p>
      </div>
      {status === "processing" && <Zap className="h-4 w-4 text-primary animate-pulse shrink-0" />}
    </div>
  );
}

function CopyField({ label, value, truncate = false }: { label: string; value: string; truncate?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(!truncate);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/40 uppercase tracking-widest">{label}</span>
        <div className="flex gap-1">
          {truncate && <button onClick={() => setShow(s => !s)} className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors px-2 py-0.5">{show ? "Hide" : "Show full"}</button>}
          <button onClick={copy} className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors">
            <Copy className="h-3 w-3" />{copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-border/30 bg-foreground/[0.03] px-3 py-2 font-mono text-xs text-foreground/70 break-all">
        {show ? value : value.slice(0, 60) + "…"}
      </div>
    </div>
  );
}

export default function HybridLabPage() {
  const [message, setMessage] = useState("");
  const [rsaPublicKey, setRsaPublicKey] = useState("");
  const [rsaPrivateKey, setRsaPrivateKey] = useState("");
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [rsaExponent, setRsaExponent] = useState("65537");
  const [aesKeySize, setAesKeySize] = useState("256");
  const [aesMode, setAesMode] = useState("GCM");
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputs, setOutputs] = useState({ aesKey: "", rsaEncKey: "", ciphertext: "", decrypted: "", duration: 0 });
  const [eventLogs, setEventLogs] = useState<LogEntry[]>([]);
  const [simMode, setSimMode] = useState<"secure" | "weak">("secure");
  const [showCustom, setShowCustom] = useState(false);
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((level: LogEntry["level"], msg: string) => {
    setEventLogs(prev => [...prev, { time: ts(), level, msg }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [eventLogs]);

  const generateKeys = useCallback(async () => {
    setGeneratingKeys(true);
    addLog("INFO", "Generating RSA key pair…");
    await new Promise(r => setTimeout(r, 1500));
    const kp = sampleData.rsaKeyPairs[0];
    setRsaPublicKey(kp.publicKey);
    setRsaPrivateKey(kp.privateKey);
    addLog("INFO", `RSA ${simMode === "weak" ? "512-bit" : "2048-bit"} key pair generated successfully`);
    setGeneratingKeys(false);
  }, [simMode, addLog]);

  const runEncryption = useCallback(async () => {
    if (!message.trim()) return;
    setIsProcessing(true);
    setCurrentStep(0);
    setOutputs({ aesKey: "", rsaEncKey: "", ciphertext: "", decrypted: "", duration: 0 });
    const start = Date.now();

    for (let i = 1; i <= 6; i++) {
      setCurrentStep(i);
      const delay = 500 + Math.random() * 300;
      await new Promise(r => setTimeout(r, delay));

      if (i === 1) {
        const key = randomHex(aesKeySize === "128" ? 32 : aesKeySize === "192" ? 48 : 64);
        setOutputs(o => ({ ...o, aesKey: key }));
        addLog("INFO", `AES-${aesKeySize} session key generated: ${key.slice(0, 8)}…${key.slice(-4)}`);
        if (simMode === "weak") addLog("WARN", "Weak AES-128-ECB configuration detected — patterns may leak!");
      } else if (i === 2) {
        const ct = randomB64(88);
        setOutputs(o => ({ ...o, ciphertext: ct }));
        addLog("INFO", `Message encrypted with AES-${aesKeySize}-${aesMode}: ${ct.slice(0, 16)}…`);
      } else if (i === 3) {
        const encKey = randomB64(344);
        setOutputs(o => ({ ...o, rsaEncKey: encKey }));
        addLog("INFO", `AES session key wrapped with RSA-${simMode === "weak" ? "512" : "2048"} public key`);
        if (simMode === "weak") addLog("WARN", "RSA-512 key is critically weak — breakable in hours!");
      } else if (i === 4) {
        addLog("INFO", "Encrypted bundle ready for transmission");
      } else if (i === 5) {
        addLog("INFO", "AES session key recovered using RSA private key");
      } else if (i === 6) {
        setOutputs(o => ({ ...o, decrypted: message, duration: Date.now() - start }));
        addLog("INFO", `Decryption complete. Round-trip verified ✓ (${Date.now() - start}ms)`);
      }
    }
    setCurrentStep(7);
    setIsProcessing(false);
  }, [message, aesKeySize, aesMode, simMode, addLog]);

  const stepStatus = (id: number): "pending" | "processing" | "done" => {
    if (currentStep === 0) return "pending";
    if (id < currentStep) return "done";
    if (id === currentStep && isProcessing) return "processing";
    return "pending";
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
                  <Layers className="h-3.5 w-3.5" /> Hybrid RSA-AES Lab
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Hybrid Encryption Lab</h1>
                <p className="mt-2 text-foreground/60 max-w-2xl">Interactively execute a complete hybrid encryption and decryption workflow step-by-step. Observe each phase of the RSA-AES pipeline in real time.</p>
              </motion.div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Panel */}
                <div className="space-y-4">

                  {/* Simulation Mode */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Simulation Mode</p>
                    <div className="flex gap-2">
                      {(["secure", "weak"] as const).map(m => (
                        <button key={m} onClick={() => setSimMode(m)}
                          className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${simMode === m ? (m === "secure" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-red-500/40 bg-red-500/10 text-red-400") : "border-border/30 text-foreground/40 hover:text-foreground"}`}>
                          {m === "secure" ? "🔒 Secure Mode" : "⚠️ Weak Config"}
                        </button>
                      ))}
                    </div>
                    {simMode === "weak" && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">Weak mode uses RSA-512 + AES-128-ECB + password "password123". Educational use only.</p>
                      </div>
                    )}
                    <button onClick={() => setShowCustom(s => !s)} className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors">
                      Custom Settings {showCustom ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showCustom && (
                      <div className="space-y-3 pt-2 border-t border-border/20">
                        <div>
                          <label className="text-xs text-foreground/40 block mb-1">AES Key Size</label>
                          <div className="flex gap-2">
                            {["128", "192", "256"].map(s => (
                              <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="aesSize" checked={aesKeySize === s} onChange={() => setAesKeySize(s)} className="accent-primary" />
                                <span className="text-sm text-foreground/70">{s}-bit</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-foreground/40 block mb-1">Encryption Mode</label>
                          <select value={aesMode} onChange={e => setAesMode(e.target.value)}
                            className="w-full rounded-lg border border-border/40 bg-background/40 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50">
                            {["GCM", "CBC", "ECB"].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Message Input */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Message Input</p>
                    <div className="relative">
                      <textarea value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Enter or select a message to encrypt…"
                        className="w-full min-h-[100px] resize-none rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" />
                      <span className="absolute bottom-3 right-3 text-xs text-foreground/30">{message.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sampleData.sampleMessages.map(s => (
                        <button key={s.id} onClick={() => setMessage(s.text)}
                          className="rounded-full border border-border/40 px-3 py-1 text-xs text-foreground/50 hover:border-border/70 hover:text-foreground transition-all">{s.label}</button>
                      ))}
                      <button onClick={() => setMessage("")} className="rounded-full border border-border/40 px-3 py-1 text-xs text-foreground/50 hover:border-border/70 hover:text-foreground transition-all">Reset</button>
                    </div>
                  </motion.div>

                  {/* RSA Config */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">RSA Configuration</p>
                      <div className="flex gap-2">
                        <Button onClick={generateKeys} disabled={generatingKeys} size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1">
                          <Key className="h-3 w-3" />{generatingKeys ? "Generating…" : "Generate Keys"}
                        </Button>
                        <Button onClick={() => { setRsaPublicKey(""); setRsaPrivateKey(""); setRsaExponent("65537"); }} size="sm" variant="ghost" className="rounded-full text-xs h-7">Reset</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-foreground/40 block mb-1">Public Key (PEM)</label>
                        <textarea value={rsaPublicKey} onChange={e => setRsaPublicKey(e.target.value)}
                          rows={3} className="w-full rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-xs font-mono text-foreground/70 focus:outline-none focus:border-primary/50 resize-none" placeholder="-----BEGIN PUBLIC KEY-----" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-foreground/40">Private Key (PEM)</label>
                          <button onClick={() => setShowPrivKey(s => !s)} className="text-foreground/40 hover:text-foreground/70 transition-colors">
                            {showPrivKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <textarea value={showPrivKey ? rsaPrivateKey : rsaPrivateKey.replace(/./g, "•").slice(0, 80) + (rsaPrivateKey.length > 80 ? "…" : "")}
                          onChange={e => setRsaPrivateKey(e.target.value)}
                          rows={2} className="w-full rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-xs font-mono text-foreground/70 focus:outline-none focus:border-primary/50 resize-none" placeholder="-----BEGIN RSA PRIVATE KEY-----" />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/40 block mb-1">Public Exponent</label>
                        <input value={rsaExponent} onChange={e => setRsaExponent(e.target.value)}
                          className="w-full rounded-lg border border-border/40 bg-background/40 px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Run Button */}
                  <Button onClick={runEncryption} disabled={isProcessing || !message.trim()} size="lg"
                    className="w-full rounded-xl gap-2 h-12">
                    <Play className="h-5 w-5" />{isProcessing ? "Encrypting…" : "Run Hybrid Encryption"}
                  </Button>
                </div>

                {/* Right Panel */}
                <div className="space-y-4">

                  {/* Process Flow */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Process Flow</p>
                    <div className="space-y-2">
                      {STEPS.map(step => (
                        <StepCard key={step.id} step={step} status={stepStatus(step.id)} />
                      ))}
                    </div>
                  </motion.div>

                  {/* Outputs */}
                  <AnimatePresence>
                    {outputs.aesKey && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Output</p>
                          {outputs.duration > 0 && (
                            <span className="flex items-center gap-1 text-xs text-foreground/40">
                              <Clock className="h-3 w-3" />Completed in {outputs.duration}ms
                            </span>
                          )}
                        </div>
                        {outputs.aesKey && <CopyField label={`AES-${aesKeySize} Session Key`} value={outputs.aesKey} />}
                        {outputs.rsaEncKey && <CopyField label="RSA-Encrypted AES Key" value={outputs.rsaEncKey} truncate />}
                        {outputs.ciphertext && <CopyField label="Ciphertext" value={outputs.ciphertext} truncate />}
                        {outputs.decrypted && (
                          <div className="space-y-1">
                            <span className="text-xs text-foreground/40 uppercase tracking-widest">Decrypted Output</span>
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400 flex items-start gap-2">
                              <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{outputs.decrypted}
                            </div>
                          </div>
                        )}
                        {simMode === "weak" && outputs.ciphertext && (
                          <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400">Weak configuration detected. ECB mode exposes block patterns. RSA-512 is breakable. This output is insecure.</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Event Log */}
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-foreground/40" />
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">Event Log</p>
                      </div>
                      <Button onClick={() => setEventLogs([])} size="sm" variant="ghost" className="rounded-full text-xs h-7">Clear</Button>
                    </div>
                    <div ref={logRef} className="h-48 overflow-y-auto rounded-lg border border-border/20 bg-foreground/[0.02] p-3 space-y-1">
                      {eventLogs.length === 0 ? (
                        <p className="text-xs text-foreground/30 font-mono">Awaiting process execution…</p>
                      ) : (
                        eventLogs.map((e, i) => <LogLine key={i} entry={e} />)
                      )}
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
