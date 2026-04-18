"use client";

import { useState } from "react";
import { useCrypto } from "@/hooks/useCrypto";
import { RefreshCw, Copy, Check, ShieldCheck, ShieldAlert, Download, Trash2, KeyRound, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

export default function KeyManagement() {
    const { publicKey, isKeyGenerated, loading, generateNewKeyPair, clearKeys } = useCrypto();
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const handleCopy = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        setGenerating(true);
        try {
            await generateNewKeyPair(password);
            setPassword("");
        } catch {
            alert("Failed to generate keys. See console.");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <RefreshCw className="w-10 h-10 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl space-y-12">
            <header className="space-y-4">
                <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight text-white">
                    <KeyRound className="text-indigo-400 w-8 h-8" />
                    Key Management Center
                </h1>
                <p className="text-slate-400 leading-relaxed max-w-2xl font-medium">
                    SecureShare uses <strong>RSA-2048</strong> end-to-end encryption. Your private key is stored locally
                    on this device, encrypted with your password.
                </p>
            </header>

            {!isKeyGenerated ? (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-1.5 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent shadow-xl border border-white/10"
                >
                    <div className="bg-slate-950/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.2rem] space-y-8 flex flex-col items-center text-center">
                        <div className="p-4 rounded-3xl bg-indigo-500/10 inline-block border border-indigo-500/20 text-indigo-400">
                            <ShieldAlert className="w-12 h-12" />
                        </div>

                        <div className="space-y-4 max-w-md">
                            <h2 className="text-2xl font-bold text-white">Initialize your Secure Vault</h2>
                            <p className="text-slate-500 text-sm">
                                Before you can send or receive files, you need to generate a new RSA cryptographic key pair.
                            </p>
                        </div>

                        <form onSubmit={handleGenerate} className="w-full max-w-sm space-y-6">
                            <div className="space-y-2 text-left">
                                <label className="text-sm font-semibold text-slate-300 ml-1">Archive Password</label>
                                <input
                                    type="password"
                                    placeholder="Master unlock password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-600 text-lg font-mono tracking-widest text-white"
                                    required
                                />
                                <p className="text-[11px] text-slate-500 mt-2 px-1">
                                    * This password is used ONLY locally to encrypt your private key. We never see it.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={generating}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 text-lg"
                            >
                                {generating ? <RefreshCw className="animate-spin w-6 h-6" /> : "Generate Secure Keys"}
                            </button>
                        </form>
                    </div>
                </motion.section>
            ) : (
                <div className="grid md:grid-cols-5 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-3 p-8 rounded-[2rem] glass-dark border border-white/10 space-y-6 overflow-hidden"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                                <ShieldCheck className="text-emerald-400 w-6 h-6" />
                                Active Public Key
                            </h3>
                            <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                Verified
                            </div>
                        </div>

                        <p className="text-slate-500 text-sm leading-relaxed">
                            This key is stored in our database so others can encrypt data for you.
                            Share this key to allow others to secure their messages.
                        </p>

                        <div className="relative group">
                            <textarea
                                readOnly
                                value={publicKey || ""}
                                className="w-full h-48 px-5 py-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-[11px] text-slate-400 focus:outline-none resize-none overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                            />
                            <button
                                onClick={handleCopy}
                                className="absolute top-4 right-4 p-2 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg shadow-lg border border-indigo-400/50 backdrop-blur-md transition-all active:scale-95"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => {
                                    const blob = new Blob([publicKey || ""], { type: "text/plain" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "secureshare_public_key.txt";
                                    a.click();
                                }}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-sm rounded-xl border border-white/10 font-bold transition-all flex items-center justify-center gap-2 text-white"
                            >
                                <Download className="w-4 h-4" /> Export Key
                            </button>
                            <button
                                onClick={() => setShowQR(!showQR)}
                                className={`flex-1 py-3 text-sm rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${showQR ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 hover:bg-white/10 border-white/10 text-white"}`}
                            >
                                <QrCode className="w-4 h-4" /> {showQR ? "Hide QR" : "View QR"}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showQR && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 p-8 bg-white rounded-3xl flex flex-col items-center gap-4 shadow-2xl mx-auto w-fit">
                                        <QRCodeSVG value={publicKey || ""} size={160} />
                                        <p className="text-[10px] text-slate-900 font-extrabold uppercase tracking-widest">Public Key Token</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Sidebar Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-2 space-y-6"
                    >
                        <div className="p-6 rounded-[2rem] glass-dark border border-white/10 space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Advanced Actions</h4>
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure? This will remove your key from this browser. You won't be able to decrypt files without re-importing.")) {
                                        clearKeys();
                                    }
                                }}
                                className="w-full p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 hover:border-rose-500/30 transition-all flex items-center gap-3 font-bold text-sm text-left group"
                            >
                                <Trash2 className="w-5 h-5 group-hover:animate-bounce" />
                                <span>Delete Key Locally</span>
                            </button>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Security Tip
                                </p>
                                <p className="text-[11px] text-slate-400 leading-normal">
                                    Never share your master password or private key. SecureShare will never ask for your private key.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
