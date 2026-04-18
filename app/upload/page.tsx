"use client";

import { useState, useEffect } from "react";
import { Upload, FileCheck, Shield, ChevronRight } from "lucide-react";
import * as cryptoLib from "@/lib/crypto/core";
import { motion, AnimatePresence } from "framer-motion";
import { useCrypto } from "@/hooks/useCrypto";
import Link from "next/link";

type Recipient = {
    clerkId: string;
    publicKey: string;
};

export default function UploadPage() {
    const { isKeyGenerated, loading: keyLoading } = useCrypto();
    const [file, setFile] = useState<File | null>(null);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState(1);

    useEffect(() => {
        fetch("/api/users")
            .then((res) => res.json())
            .then((data) => setRecipients(data))
            .catch(console.error);
    }, []);

    const handleUpload = async () => {
        if (!file || !selectedRecipient) return;

        setUploading(true);
        setProgress(10);
        try {
            const recipient = recipients.find((r) => r.clerkId === selectedRecipient);
            if (!recipient) throw new Error("Recipient not found.");

            // 1. Generate AES key
            const aesKey = await cryptoLib.generateAESKey();
            setProgress(30);

            // 2. Encrypt file using AES
            const fileBuffer = await file.arrayBuffer();
            const { encrypted, iv } = await cryptoLib.encryptData(fileBuffer, aesKey);
            setProgress(60);

            // 3. Encrypt AES key using recipient's RSA public key
            const rsaPubKey = await cryptoLib.importPublicKey(recipient.publicKey);
            const wrappedAESKey = await cryptoLib.wrapAESKey(aesKey, rsaPubKey);
            setProgress(80);

            // 4. Save metadata only
            await fetch("/api/files", {
                method: "POST",
                body: JSON.stringify({
                    filename: file.name,
                    receiverId: selectedRecipient,
                    encryptedKey: wrappedAESKey,
                    iv: iv,
                    encryptedFileUrl: encrypted,
                }),
            });

            setProgress(100);
            setTimeout(() => {
                setStep(3);
                setUploading(false);
            }, 500);
        } catch (err) {
            console.error("Encryption/Upload failed:", err);
            alert("Something went wrong!");
            setUploading(false);
        }
    };

    if (keyLoading) return <div className="p-12 text-center text-slate-500">Initializing...</div>;

    if (!isKeyGenerated) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-6">
                <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/10 text-rose-400">
                    <Shield className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">Key Setup Required</h2>
                    <p className="text-slate-500 max-w-sm">Please initialize your RSA keys before you can securely share files.</p>
                </div>
                <Link href="/key-management" className="px-8 py-3 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all text-white">Go to Keys</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-3xl space-y-8">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Secure Upload</h1>
                <div className="flex gap-2 text-[10px] uppercase font-black tracking-widest text-slate-600">
                    <div className={`px-2 py-1 rounded border ${step >= 1 ? "border-indigo-500 text-indigo-400" : "border-white/5"}`}>1. Prepare</div>
                    <div className={`px-2 py-1 rounded border ${step >= 2 ? "border-indigo-500 text-indigo-400" : "border-white/5"}`}>2. Recipient</div>
                    <div className={`px-2 py-1 rounded border ${step >= 3 ? "border-indigo-500 text-indigo-400" : "border-white/5"}`}>3. Success</div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step-1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                            }}
                            className="p-12 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-500/50 transition-all cursor-pointer text-center space-y-6 group"
                        >
                            <input type="file" id="dropzone" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            <label htmlFor="dropzone" className="cursor-pointer block space-y-6">
                                <div className="mx-auto w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-indigo-500/20 border border-indigo-500/10">
                                    {file ? <FileCheck className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-bold text-slate-200">{file ? file.name : "Drop file here"}</p>
                                    <p className="text-slate-500 text-sm">Max 50MB per file. Encrypted in-browser.</p>
                                </div>
                            </label>
                        </div>
                        {file && (
                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-lg transition-all hover:bg-indigo-500 flex items-center justify-center gap-2 group text-white shadow-lg shadow-indigo-600/20"
                            >
                                Continue to Recipient <ChevronRight className="w-5 h-5 group-hover:translate-x-1" />
                            </button>
                        )}
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div key="step-2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                        <div className="p-8 glass-dark rounded-[2rem] border border-white/10 space-y-8">
                            <div className="flex items-center gap-4 text-emerald-400 text-sm font-bold bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                <Shield className="w-5 h-5" />
                                {"Ready to encrypt '"}{file?.name}{"'. Choose a recipient."}
                            </div>

                            <div className="space-y-4 text-slate-100">
                                <label className="text-xs uppercase font-black text-slate-500 tracking-[0.2em]">Select Recipient</label>
                                <div className="grid gap-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
                                    {recipients.length === 0 ? (
                                        <p className="p-12 text-center text-slate-600 border border-dashed border-white/5 rounded-2xl italic">No other users found.</p>
                                    ) : recipients.map((r) => (
                                        <div
                                            key={r.clerkId}
                                            onClick={() => setSelectedRecipient(r.clerkId)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${selectedRecipient === r.clerkId ? "bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold uppercase text-xs border border-white/5">
                                                    {r.clerkId.slice(-2)}
                                                </div>
                                                <div className="text-sm font-bold truncate max-w-[200px] text-slate-300">User_{r.clerkId.slice(-10)}</div>
                                            </div>
                                            {selectedRecipient === r.clerkId && <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center border border-indigo-400"><FileCheck className="w-3 h-3 text-white" /></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {uploading ? (
                                <div className="space-y-4">
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-black uppercase text-indigo-400 tracking-widest">
                                        <span>Encrypting with AES-GCM...</span>
                                        <span>{progress}%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setStep(1)} className="py-4 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition-all border border-white/5 text-slate-300">Back</button>
                                    <button
                                        disabled={!selectedRecipient}
                                        onClick={handleUpload}
                                        className="py-4 rounded-2xl bg-indigo-600 font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-30 text-white"
                                    >
                                        Submit to Vault
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div key="step-3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12 space-y-8 glass-dark rounded-[3rem] border-2 border-emerald-500/20 shadow-2xl">
                        <div className="mx-auto w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border-2 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)] mb-4">
                            <FileCheck className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-white">Encryption Successful</h2>
                            <p className="text-slate-400 leading-relaxed max-w-sm mx-auto font-medium">
                                Your file has been secured with a session AES key, which was then wrapped with the recipient&apos;s RSA public key.
                            </p>
                        </div>
                        <Link href="/dashboard" className="inline-block px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all hover:scale-105 shadow-xl shadow-emerald-600/20">Go to Dashboard</Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
