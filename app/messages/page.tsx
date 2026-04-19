"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Lock, Loader2, Eye } from "lucide-react";
import { useCrypto } from "@/hooks/useCrypto";
import * as cryptoLib from "@/lib/crypto/core";
import { motion } from "framer-motion";

type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    encryptedKey: string;
    iv: string;
    createdAt: string;
};

type Recipient = {
    clerkId: string;
    publicKey: string;
};

export default function MessagesPage() {
    const { getPrivateKey, loading: keyLoading } = useCrypto();
    const [messages, setMessages] = useState<Message[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<string>("");
    const [newMessage, setNewMessage] = useState("");
    const [password, setPassword] = useState("");
    const [isDecrypted, setIsDecrypted] = useState<Record<string, string>>({});
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Backend removed.
        setRecipients([]);
        setMessages([]);
    }, []);

    const fetchMessages = () => {
        // No-op (Backend disabled)
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage || !selectedRecipient || sending) return;

        setSending(true);
        try {
            const recipient = recipients.find(r => r.clerkId === selectedRecipient);
            if (!recipient) throw new Error("Recipient not found.");

            const aesKey = await cryptoLib.generateAESKey();
            const { encrypted, iv } = await cryptoLib.encryptData(newMessage, aesKey);
            const rsaPubKey = await cryptoLib.importPublicKey(recipient.publicKey);
            const wrappedKey = await cryptoLib.wrapAESKey(aesKey, rsaPubKey);

            // Simulation only
            setMessages(prev => [...prev, {
                id: Math.random().toString(),
                senderId: "me",
                receiverId: selectedRecipient,
                content: encrypted,
                encryptedKey: wrappedKey,
                iv: iv,
                createdAt: new Date().toISOString()
            }]);

            setNewMessage("");
        } catch (err) {
            console.error(err);
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    const handleDecryptMessage = async (msg: Message) => {
        if (!password) {
            alert("Enter master password to decrypt history.");
            return;
        }

        try {
            const privKey = await getPrivateKey(password);
            const aesKey = await cryptoLib.unwrapAESKey(msg.encryptedKey, privKey);
            const decrypted = await cryptoLib.decryptData(msg.content, msg.iv, aesKey);
            const text = new TextDecoder().decode(decrypted);

            setIsDecrypted(prev => ({ ...prev, [msg.id]: text }));
        } catch (err) {
            console.error(err);
        }
    };

    if (keyLoading) return <div className="p-24 text-center text-slate-100"><Loader2 className="animate-spin inline-block mr-2" /> Initializing...</div>;

    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl h-[calc(100vh-120px)] flex gap-8 text-slate-100">
            {/* Sidebar - Contacts */}
            <aside className="hidden md:flex flex-col w-80 glass-dark rounded-[2.5rem] border border-white/10 p-8 space-y-8 overflow-hidden">
                <h3 className="text-xl font-bold tracking-tight text-white">Active Contacts</h3>
                <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                    {recipients.map(r => (
                        <button
                            key={r.clerkId}
                            onClick={() => setSelectedRecipient(r.clerkId)}
                            className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${selectedRecipient === r.clerkId ? "bg-indigo-600/15 border-indigo-500 shadow-xl shadow-indigo-500/10 text-white" : "bg-white/5 border-white/5 hover:bg-white/[0.08] text-slate-400"}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-white/5 shrink-0">
                                {r.clerkId.slice(-2)}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold truncate pr-4">User_{r.clerkId.slice(-8)}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">RSA-2048 Ready</div>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col glass-dark rounded-[2.5rem] border border-white/10 overflow-hidden relative">
                <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 bg-black/40">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="font-bold text-lg text-white">Secure Thread</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="password"
                            placeholder="Master Unlock Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="hidden sm:block px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500 transition-all outline-none md:w-48 text-white"
                        />
                    </div>
                </header>

                {/* Message Feed */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex flex-col ${m.senderId === m.senderId ? "items-end" : "items-start"}`}
                        >
                            <div className="group relative max-w-[80%]">
                                <div
                                    onClick={() => handleDecryptMessage(m)}
                                    className={`p-4 rounded-3xl cursor-pointer transition-all border ${isDecrypted[m.id] ? "bg-indigo-600/10 border-indigo-500/20 text-slate-200" : "bg-white/5 border-white/5 hover:bg-white/[0.08] text-slate-500 italic text-sm"}`}
                                >
                                    {isDecrypted[m.id] ? isDecrypted[m.id] : (
                                        <div className="flex items-center gap-3">
                                            <Eye className="w-4 h-4 opacity-50" />
                                            <span>Encrypted Blob (Click to Decrypt)</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-1 text-[9px] uppercase font-black tracking-widest text-slate-600 px-2">
                                    {new Date(m.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    <div ref={scrollRef} />
                </div>

                {/* Input Bar */}
                <footer className="p-8 border-t border-white/5 bg-black/40">
                    {!selectedRecipient ? (
                        <div className="text-center p-4 border border-dashed border-white/10 rounded-2xl text-slate-600 text-xs font-bold uppercase tracking-widest">
                            Select a recipient from the sidebar to start secure chat
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="flex gap-4">
                            <input
                                autoFocus
                                placeholder={`Write secure message for User_${selectedRecipient.slice(-6)}...`}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 text-white"
                            />
                            <button
                                type="submit"
                                disabled={sending}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                            >
                                {sending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    )}
                </footer>
            </main>
        </div>
    );
}
