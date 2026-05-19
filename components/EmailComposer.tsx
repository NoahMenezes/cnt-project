"use client";

import React, { useState } from "react";
import { X, Plus, Paperclip, Send, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: EmailData) => void;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachments: File[];
}

export function EmailComposer({ isOpen, onClose, onSend }: EmailComposerProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      alert("Please fill in all fields");
      return;
    }

    setIsEncrypting(true);
    // Simulate encryption
    setTimeout(() => {
      onSend({ to, subject, body, attachments });
      setTo("");
      setSubject("");
      setBody("");
      setAttachments([]);
      setIsEncrypting(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl liquid-glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Compose Encrypted Email</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {/* To */}
                <div>
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">
                    Message (AES-256 Encrypted)
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your encrypted message here..."
                    rows={8}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all resize-none"
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">
                    Attachments (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 px-4 py-3 bg-white/5 border border-dashed border-cyan-400/30 rounded-lg text-white/60 hover:bg-white/10 hover:border-cyan-400/50 cursor-pointer transition-all">
                      <div className="flex items-center justify-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm font-medium">Click to attach files</span>
                      </div>
                      <input
                        type="file"
                        multiple
                        onChange={handleAttach}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm text-white/80">{file.name}</span>
                            <span className="text-xs text-white/40">
                              ({(file.size / 1024).toFixed(2)} KB)
                            </span>
                          </div>
                          <button
                            onClick={() => removeAttachment(idx)}
                            className="p-1 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Security Notice */}
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-start gap-3">
                  <Lock className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-white/70">
                    <p className="font-semibold text-cyan-400 mb-1">Hybrid Encryption Active</p>
                    <p>Your message will be encrypted with AES-256. The AES key will be encrypted with the recipient's RSA-2048 public key.</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/40">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isEncrypting}
                  className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                >
                  {isEncrypting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Encrypted
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
