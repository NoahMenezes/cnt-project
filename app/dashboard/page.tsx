"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Inbox as InboxIcon, 
  Send, 
  Key, 
  Settings, 
  Plus, 
  Mail,
  User,
  Shield,
  Trash2,
  LogOut
} from "lucide-react";

import { EmailComposer, type EmailData } from "../../components/EmailComposer";
import { Inbox, type EmailItem } from "../../components/Inbox";
import { EmailViewer } from "../../components/EmailViewer";
import { KeyManagement } from "../../components/KeyManagement";
import { UserButton } from "@clerk/nextjs";

// Mock Emails
const MOCK_EMAILS: EmailItem[] = [
  {
    id: "1",
    from: "alice@example.com",
    subject: "Project Update",
    preview: "Hey, just wanted to check in on the progress of the new encryption module.",
    timestamp: "10:30 AM",
    isRead: false,
    isEncrypted: true,
    hasAttachments: false,
  },
  {
    id: "2",
    from: "bob@secure.org",
    subject: "Keys renewed",
    preview: "Your PGP keys have been successfully renewed for another year.",
    timestamp: "Yesterday",
    isRead: true,
    isEncrypted: true,
    hasAttachments: false,
  },
  {
    id: "3",
    from: "marketing@spamt.com",
    subject: "Last chance to save!",
    preview: "Open this email to see your exclusive discount for the weekend sale.",
    timestamp: "2 days ago",
    isRead: true,
    isEncrypted: false,
    hasAttachments: true,
  },
];

type Tab = "inbox" | "sent" | "keys" | "settings";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [emails, setEmails] = useState<EmailItem[]>(MOCK_EMAILS);

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  const handleSendEmail = (data: EmailData) => {
    console.log("Sending email:", data);
    setIsComposeOpen(false);
  };

  const handleSelectEmail = (email: EmailItem) => {
    setSelectedEmailId(email.id);
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
  };

  const renderContent = () => {
    if (selectedEmail && activeTab === "inbox") {
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="h-full"
        >
          <EmailViewer 
            email={selectedEmail} 
            onBack={() => setSelectedEmailId(null)} 
          />
        </motion.div>
      );
    }

    switch (activeTab) {
      case "inbox":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            <div className="p-6 border-b border-white/10 backdrop-blur-sm flex justify-between items-center">
              <motion.h2 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-white flex items-center gap-3"
              >
                <InboxIcon className="w-6 h-6 text-cyan-400" /> Inbox
              </motion.h2>
            </div>
            <Inbox 
              emails={emails} 
              onSelectEmail={handleSelectEmail} 
              selectedId={selectedEmailId || undefined} 
            />
          </motion.div>
        );
      case "keys":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-h-screen overflow-y-auto"
          >
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-8"
            >
              Key Management
            </motion.h2>
            <div className="grid grid-cols-1 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-cyan-400/30 bg-white/5 backdrop-blur-xl overflow-hidden hover:border-cyan-400/60 transition-all duration-300"
              >
                <KeyManagement userId="user_123" />
              </motion.div>
            </div>
          </motion.div>
        );
      case "sent":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center h-full flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="p-6 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/30 mb-6">
                <Send className="w-12 h-12 text-cyan-400 opacity-50" />
              </div>
            </motion.div>
            <p className="text-white/50 text-lg">Your sent messages will appear here.</p>
          </motion.div>
        );
      case "settings":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 max-h-screen overflow-y-auto"
          >
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-8"
            >
              Settings
            </motion.h2>
            <div className="space-y-4 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl border border-cyan-400/30 bg-white/5 backdrop-blur-xl hover:border-cyan-400/60 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-cyan-400/20 group-hover:bg-cyan-400/30 transition-all">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Profile</p>
                    <p className="text-sm text-white/50">Manage your personal information</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 transition-all text-sm font-medium">
                  Edit
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-xl border border-cyan-400/30 bg-white/5 backdrop-blur-xl hover:border-cyan-400/60 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-all">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Security</p>
                    <p className="text-sm text-white/50">Two-factor authentication & privacy</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-blue-400/50 text-blue-400 hover:bg-blue-400/10 transition-all text-sm font-medium">
                  Configure
                </button>
              </motion.div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#0c0c0c] overflow-hidden text-white relative">
      {/* SVG Noise Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <filter id="dashboard-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col relative z-20">
        {/* Background glow effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="p-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 font-bold text-xl mb-8"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-white">SecureEmail</span>
          </motion.div>
          
          <motion.button 
            onClick={() => setIsComposeOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/40 transition-all duration-300"
          >
            <Plus className="w-5 h-5" /> Compose
          </motion.button>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <SidebarItem 
            icon={<InboxIcon className="w-5 h-5" />} 
            label="Inbox" 
            active={activeTab === "inbox"} 
            onClick={() => { setActiveTab("inbox"); setSelectedEmailId(null); }} 
            count={emails.filter(e => !e.isRead).length}
          />
          <SidebarItem 
            icon={<Send className="w-5 h-5" />} 
            label="Sent" 
            active={activeTab === "sent"} 
            onClick={() => { setActiveTab("sent"); setSelectedEmailId(null); }} 
          />
          <SidebarItem 
            icon={<Key className="w-5 h-5" />} 
            label="Keys" 
            active={activeTab === "keys"} 
            onClick={() => { setActiveTab("keys"); setSelectedEmailId(null); }} 
          />
          <div className="pt-4 mt-4 border-t border-white/10">
            <SidebarItem 
              icon={<Settings className="w-5 h-5" />} 
              label="Settings" 
              active={activeTab === "settings"} 
              onClick={() => { setActiveTab("settings"); setSelectedEmailId(null); }} 
            />
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 relative z-10">
          <UserButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-l from-cyan-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-gradient-to-t from-blue-600/5 to-transparent rounded-full blur-3xl" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedEmailId || "")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto relative z-10"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Compose Modal */}
      <EmailComposer 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        onSend={handleSendEmail} 
      />
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  count?: number;
}

function SidebarItem({ icon, label, active, onClick, count }: SidebarItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.95 }}
      className={`
        w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300
        ${active 
          ? "bg-gradient-to-r from-cyan-400/30 to-blue-600/30 text-cyan-200 border border-cyan-400/50 shadow-lg shadow-cyan-400/20" 
          : "text-white/60 hover:text-white hover:bg-white/10 border border-transparent"}
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {count && count > 0 ? (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${active ? "bg-cyan-400 text-white" : "bg-cyan-400/30 text-cyan-200"}`}
        >
          {count}
        </motion.span>
      ) : null}
    </motion.button>
  );
}
