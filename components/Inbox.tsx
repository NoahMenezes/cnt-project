"use client";

import React, { useState } from "react";
import { Lock, File } from "lucide-react";
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
      {/* Filter Tabs */}
      <div className="p-4 border-b border-[#23252a] flex gap-2">
        {["all", "unread", "encrypted"].map((f) => (
          <motion.button
            key={f}
            onClick={() => setFilter(f as any)}
            whileHover={{ backgroundColor: "#161718" }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
              filter === f
                ? "bg-[#0f1011] border border-[#e4f222] border-opacity-40 text-[#e4f222]"
                : "bg-transparent border border-[#23252a] text-[#8a8f98] hover:text-[#d0d6e0] hover:border-[#323334]"
            }`}
            style={{ letterSpacing: "-0.11px" }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredEmails.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#8a8f98] text-sm">No emails found</p>
          </div>
        ) : (
          <>
            {filteredEmails.map((email, idx) => (
              <motion.button
                key={email.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onSelectEmail(email)}
                whileHover={{ backgroundColor: "#0f1011" }}
                className={`w-full border border-[#23252a] rounded-md p-4 flex items-start gap-4 transition-all text-left ${
                  selectedId === email.id
                    ? "bg-[#161718] border-[#e4f222] border-opacity-50"
                    : "bg-[#08090a] hover:bg-[#0f1011]"
                }`}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
                  email.isEncrypted 
                    ? "bg-[#e4f222]/10" 
                    : "bg-[#62666d]/10"
                }`}>
                  <Lock className={`w-5 h-5 ${
                    email.isEncrypted 
                      ? "text-[#e4f222]" 
                      : "text-[#8a8f98]"
                  }`} strokeWidth={2} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`font-semibold ${
                        email.isRead ? "text-[#8a8f98]" : "text-[#f7f8f8]"
                      }`}
                      style={{ letterSpacing: "-0.11px" }}
                    >
                      {email.from}
                    </h3>
                    {email.hasAttachments && (
                      <File className="w-3.5 h-3.5 text-[#d0d6e0]" strokeWidth={2} />
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      email.isRead ? "text-[#62666d]" : "text-[#d0d6e0]"
                    }`}
                  >
                    {email.subject}
                  </p>
                  <p className="text-xs text-[#8a8f98] mt-1">
                    {email.preview}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-[#8a8f98]">{email.timestamp}</span>
                  {!email.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#e4f222]" />
                  )}
                </div>
              </motion.button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
