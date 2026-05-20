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
  ChevronRight,
  LogOut,
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

const tabConfig: Record<Tab, { label: string; icon: React.ReactNode; description: string }> = {
  inbox: {
    label: "Inbox",
    icon: <InboxIcon className="w-5 h-5" strokeWidth={1.5} />,
    description: "Manage your encrypted messages",
  },
  sent: {
    label: "Sent",
    icon: <Send className="w-5 h-5" strokeWidth={1.5} />,
    description: "Your sent messages",
  },
  keys: {
    label: "Keys",
    icon: <Key className="w-5 h-5" strokeWidth={1.5} />,
    description: "Manage encryption keys",
  },
  settings: {
    label: "Settings",
    icon: <Settings className="w-5 h-5" strokeWidth={1.5} />,
    description: "Account and security settings",
  },
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [emails, setEmails] = useState<EmailItem[]>(MOCK_EMAILS);

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);
  const unreadCount = emails.filter((e) => !e.isRead).length;

  const handleSendEmail = (data: EmailData) => {
    console.log("Sending email:", data);
    setIsComposeOpen(false);
  };

  const handleSelectEmail = (email: EmailItem) => {
    setSelectedEmailId(email.id);
    setEmails((prev) =>
      prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e))
    );
  };

  const renderContent = () => {
    if (selectedEmail && activeTab === "inbox") {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col bg-[#08090a]"
          >
            <div className="px-8 py-6 border-b border-[#23252a]">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl font-semibold text-[#f7f8f8]" style={{ letterSpacing: "-0.22px" }}>
                  Inbox
                </h1>
                <p className="text-sm text-[#8a8f98] mt-1">
                  {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
                </p>
              </motion.div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-md border border-[#23252a] bg-[#0f1011] overflow-hidden shadow-sm"
              >
                <Inbox
                  emails={emails}
                  onSelectEmail={handleSelectEmail}
                  selectedId={selectedEmailId || undefined}
                />
              </motion.div>
            </div>
          </motion.div>
        );

      case "sent":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col items-center justify-center bg-[#08090a]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-md bg-[#0f1011] border border-[#23252a] flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-[#8a8f98]" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-semibold text-[#f7f8f8] mb-2">No sent messages</h2>
              <p className="text-sm text-[#8a8f98]">Your sent messages will appear here</p>
            </motion.div>
          </motion.div>
        );

      case "keys":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col bg-[#08090a]"
          >
            <div className="px-8 py-6 border-b border-[#23252a]">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl font-semibold text-[#f7f8f8]" style={{ letterSpacing: "-0.22px" }}>
                  Key Management
                </h1>
                <p className="text-sm text-[#8a8f98] mt-1">
                  Manage and monitor your encryption keys
                </p>
              </motion.div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-md border border-[#23252a] bg-[#0f1011] overflow-hidden shadow-sm"
              >
                <KeyManagement userId="user_123" />
              </motion.div>
            </div>
          </motion.div>
        );

      case "settings":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col bg-[#08090a]"
          >
            <div className="px-8 py-6 border-b border-[#23252a]">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl font-semibold text-[#f7f8f8]" style={{ letterSpacing: "-0.22px" }}>
                  Settings
                </h1>
                <p className="text-sm text-[#8a8f98] mt-1">
                  Manage your account and security preferences
                </p>
              </motion.div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-2xl space-y-3">
                <SettingCard
                  icon={<Mail className="w-5 h-5" strokeWidth={1.5} />}
                  title="Email Settings"
                  description="Update your email address and notification preferences"
                  delay={0.1}
                />
                <SettingCard
                  icon={<Key className="w-5 h-5" strokeWidth={1.5} />}
                  title="Security"
                  description="Manage password, two-factor authentication, and sessions"
                  delay={0.2}
                />
                <SettingCard
                  icon={<Settings className="w-5 h-5" strokeWidth={1.5} />}
                  title="Preferences"
                  description="Customize your dashboard and interface preferences"
                  delay={0.3}
                />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#08090a] text-[#f7f8f8] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#23252a] bg-[#08090a] flex flex-col h-screen sticky top-0 left-0">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border-b border-[#23252a]"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-md bg-[#e4f222] flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#08090a]" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-semibold text-base text-[#f7f8f8]" style={{ letterSpacing: "-0.12px" }}>
                SecureEmail
              </h2>
              <p className="text-xs text-[#8a8f98]">v1.0</p>
            </div>
          </div>

          <motion.button
            onClick={() => setIsComposeOpen(true)}
            whileHover={{ scale: 1.02, backgroundColor: "#f0ff33" }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-[#e4f222] text-[#08090a] font-semibold text-sm transition-all duration-200 hover:bg-[#f0ff33]"
            style={{ letterSpacing: "-0.11px" }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Compose
          </motion.button>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {Object.entries(tabConfig).map(([key, config], index) => (
            <SidebarNavItem
              key={key}
              tab={key as Tab}
              config={config}
              active={activeTab === key}
              onClick={() => {
                setActiveTab(key as Tab);
                setSelectedEmailId(null);
              }}
              count={key === "inbox" ? unreadCount : undefined}
              delay={index * 0.05}
            />
          ))}
        </nav>

        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 border-t border-[#23252a]"
        >
          <UserButton />
        </motion.div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-16 border-b border-[#23252a] bg-[#08090a] px-8 flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold text-[#f7f8f8]" style={{ letterSpacing: "-0.11px" }}>
              {tabConfig[activeTab].label}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8a8f98]">
            <span>{tabConfig[activeTab].description}</span>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedEmailId || "")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
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

interface SidebarNavItemProps {
  tab: Tab;
  config: { label: string; icon: React.ReactNode; description: string };
  active: boolean;
  onClick: () => void;
  count?: number;
  delay: number;
}

function SidebarNavItem({
  tab,
  config,
  active,
  onClick,
  count,
  delay,
}: SidebarNavItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.95 }}
      className={`
        w-full flex items-center justify-between px-4 py-3 rounded-md transition-all duration-200 group
        ${
          active
            ? "bg-[#0f1011] text-[#f7f8f8] border border-[#e4f222] border-opacity-30"
            : "text-[#8a8f98] hover:text-[#d0d6e0] hover:bg-[#0f1011] border border-transparent"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`transition-colors ${
            active ? "text-[#e4f222]" : "text-[#8a8f98] group-hover:text-[#d0d6e0]"
          }`}
        >
          {config.icon}
        </div>
        <span className="text-sm font-medium" style={{ letterSpacing: "-0.11px" }}>
          {config.label}
        </span>
      </div>
      {count !== undefined && count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-[#e4f222] text-[#08090a] text-xs font-semibold"
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  );
}

interface SettingCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function SettingCard({ icon, title, description, delay }: SettingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ borderColor: "#323334", backgroundColor: "#161718" }}
      className="p-4 rounded-md border border-[#23252a] bg-[#0f1011] transition-all duration-200 group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-md bg-[#161718] text-[#8a8f98] group-hover:text-[#d0d6e0] transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-[#f7f8f8] text-sm" style={{ letterSpacing: "-0.11px" }}>
            {title}
          </h4>
          <p className="text-xs text-[#8a8f98] mt-0.5">{description}</p>
        </div>
        <motion.div
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
          className="text-[#8a8f98] group-hover:text-[#e4f222] transition-colors"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </motion.div>
      </div>
    </motion.div>
  );
}
