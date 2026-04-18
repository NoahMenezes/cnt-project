"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, File, Loader2, Key, Send, FileText, DownloadCloud } from "lucide-react";
import { useCrypto } from "@/hooks/useCrypto";
import * as cryptoLib from "@/lib/crypto/core";
import { motion } from "framer-motion";
import Link from "next/link";

type SharedFile = {
    id: string;
    filename: string;
    encryptedKey: string;
    iv: string;
    encryptedFileUrl: string;
    senderId: string;
    receiverId: string;
    createdAt: string;
};

export default function Dashboard() {
    const { getPrivateKey, loading: keyLoading } = useCrypto();
    const [files, setFiles] = useState<SharedFile[]>([]);
    const [decrypting, setDecrypting] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [showPasswordInput, setShowPasswordInput] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/files")
            .then((res) => res.json())
            .then((data) => setFiles(data))
            .catch(console.error);
    }, []);

    const handleDecrypt = async (f: SharedFile) => {
        if (!password) {
            setShowPasswordInput(f.id);
            return;
        }

        setDecrypting(f.id);
        try {
            // 1. Get private key (decrypts with password)
            const privKey = await getPrivateKey(password);

            // 2. Unwrap AES key using RSA
            const aesKey = await cryptoLib.unwrapAESKey(f.encryptedKey, privKey);

            // 3. Decrypt file using AES
            const decryptedBuffer = await cryptoLib.decryptData(f.encryptedFileUrl, f.iv, aesKey);

            // 4. Trigger download
            const blob = new Blob([decryptedBuffer]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = f.filename;
            a.click();

            setShowPasswordInput(null);
            setPassword("");
        } catch (err) {
            console.error("Decryption failed:", err);
            alert("Decryption failed. Check your password.");
        } finally {
            setDecrypting(null);
        }
    };

    if (keyLoading) return <div className="p-24 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading Secure Environment...</div>;

    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl space-y-12 text-slate-100">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tighter text-white">Your Vault</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Access and manage your end-to-end encrypted assets.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/upload" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold flex items-center gap-2 transition-all">
                        <Send className="w-4 h-4" /> Share File
                    </Link>
                    <Link href="/key-management" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/15">
                        <Key className="w-4 h-4" /> Key Center
                    </Link>
                </div>
            </header>

            {files.length === 0 ? (
                <div className="p-24 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                    <div className="mx-auto w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-slate-700 shadow-inner border border-white/5">
                        <File className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold font-mono tracking-tighter uppercase text-[11px] text-indigo-400">System Status: No Records</h3>
                        <p className="text-slate-600 max-w-xs mx-auto text-sm leading-relaxed">No encrypted files have been shared with you yet. Start by inviting colleagues.</p>
                    </div>
                    <button className="px-8 py-3 bg-white/5 rounded-xl text-sm font-bold border border-white/5 hover:bg-white/10 transition-all">Download Public Key QR</button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {files.map((f, i) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group p-1.5 rounded-3xl bg-gradient-to-r from-white/10 to-transparent hover:from-indigo-500/10 transition-all border border-white/5 hover:border-indigo-500/20"
                        >
                            <div className="bg-slate-950/90 backdrop-blur-xl p-5 md:p-6 rounded-[1.3rem] flex items-center justify-between gap-6">
                                <div className="flex items-center gap-6 min-w-0">
                                    <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-indigo-500/10 items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform duration-500 shadow-lg group-hover:shadow-indigo-500/10 border border-indigo-500/10">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <h3 className="font-bold text-lg text-slate-200 truncate pr-4">{f.filename}</h3>
                                        <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">
                                            <span className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/10">
                                                <Lock className="w-3 h-3" /> RSA-Wrapped
                                            </span>
                                            <span>ID: {f.id.slice(-8)}</span>
                                            <span className="opacity-40">{new Date(f.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    {showPasswordInput === f.id ? (
                                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                                            <input
                                                autoFocus
                                                type="password"
                                                placeholder="Master password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleDecrypt(f)}
                                                className="w-40 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white"
                                            />
                                            <button
                                                onClick={() => handleDecrypt(f)}
                                                className="p-2.5 bg-indigo-600 rounded-xl hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                {decrypting === f.id ? <Loader2 className="animate-spin w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowPasswordInput(f.id)}
                                            className="group/btn relative px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all flex items-center gap-2 overflow-hidden"
                                        >
                                            <DownloadCloud className="w-4 h-4 transition-transform group-hover/btn:translate-y-px" /> Decrypt & Save
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
