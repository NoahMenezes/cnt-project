"use client";

import React, { useState } from "react";
import { Mail, Lock, Clock, File } from "lucide-react";
import { motion } from "motion/react";

export interface EmailItem {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  hasAttachments: boolean;
  isEncrypted: boolean;
}

interface InboxProps {
  emails: EmailItem[];
  onSelectEmail: (email: EmailItem) => void;
  selectedId?: string;
}

export function Inbox({ emails, onSelectEmail, selectedId }: InboxProps) {
  const [filter, setFilter] = useState<"all" | "unread" | "encrypted">("all");

  const filteredEmails = emails.filter((email) => {
    if (filter === "unread") return !email.isRead;
    if (filter === "encrypted") return email.isEncrypted;
    return true;
  });

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-black/40">
        <h2 className="text-2xl font-bold text-white mb-4">Inbox</h2>
        <div className="flex gap-2">
          {["all", "unread", "encrypted"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400"
                  : "bg-white/5 border border-white/10 text-white/60 hover:text-white/80"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto space-y-1 p-4">
        {filteredEmails.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/40">
            <p>No emails found</p>
          </div>
        ) : (
          filteredEmails.map((email, idx) => (
            <motion.button
              key={email.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelectEmail(email)}
              className={`w-full p-4 rounded-lg transition-all text-left ${
                selectedId === email.id
                  ? "bg-white/10 border border-cyan-500/50 shadow-[0_0_20px_rgba(0,210,255,0.1)]"
                  : "bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold truncate ${
                      email.isRead ? "text-white/60" : "text-white"
                    }`}>
                      {email.from}
                    </h3>
                    {email.isEncrypted && (
                      <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm truncate ${
                    email.isRead ? "text-white/40" : "text-white/60"
                  }`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-white/30 truncate mt-1">
                    {email.preview}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-white/40">{email.timestamp}</span>
                  <div className="flex items-center gap-1">
                    {email.hasAttachments && (
                      <File className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {!email.isRead && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
