"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Inbox as InboxIcon, 
  Send, 
  Key, 
  Settings, 
  Plus, 
  Menu,
  X,
  Mail,
  User,
  Shield,
  Trash2
} from "lucide-react";

import { EmailComposer, type EmailData } from "../../components/EmailComposer";
import { Inbox, type EmailItem } from "../../components/Inbox";
import { EmailViewer } from "../../components/EmailViewer";
import { KeyManagement } from "../../components/KeyManagement";
import { Button } from "../../components/ui/button";

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
    // In a real app, we would add it to the 'sent' list
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
            <div className="p-4 border-b bg-background/50 backdrop-blur-sm flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <InboxIcon className="w-5 h-5" /> Inbox
              </h2>
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
              </div>
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
            className="p-6"
          >
            <KeyManagement userId="user_123" />
          </motion.div>
        );
      case "sent":
        return (
          <div className="p-12 text-center text-muted-foreground">
            <Send className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Your sent messages will appear here.</p>
          </div>
        );
      case "settings":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 max-w-2xl mx-auto space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Profile</p>
                      <p className="text-sm text-muted-foreground">Manage your personal information</p>
                    </div>
                  </div>
                  <Button variant="outline">Edit</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Security</p>
                      <p className="text-sm text-muted-foreground">Two-factor authentication & privacy</p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl mb-6">
            <div className="bg-primary text-primary-foreground p-1 rounded">
              <Mail className="w-5 h-5" />
            </div>
            <span>CipherMail</span>
          </div>
          
          <Button 
            onClick={() => setIsComposeOpen(true)}
            className="w-full justify-start gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Compose
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <SidebarItem 
            icon={<InboxIcon className="w-4 h-4" />} 
            label="Inbox" 
            active={activeTab === "inbox"} 
            onClick={() => { setActiveTab("inbox"); setSelectedEmailId(null); }} 
            count={emails.filter(e => !e.isRead).length}
          />
          <SidebarItem 
            icon={<Send className="w-4 h-4" />} 
            label="Sent" 
            active={activeTab === "sent"} 
            onClick={() => { setActiveTab("sent"); setSelectedEmailId(null); }} 
          />
          <SidebarItem 
            icon={<Key className="w-4 h-4" />} 
            label="Key Management" 
            active={activeTab === "keys"} 
            onClick={() => { setActiveTab("keys"); setSelectedEmailId(null); }} 
          />
          <div className="pt-4 mt-4 border-t border-border/50">
            <SidebarItem 
              icon={<Settings className="w-4 h-4" />} 
              label="Settings" 
              active={activeTab === "settings"} 
              onClick={() => { setActiveTab("settings"); setSelectedEmailId(null); }} 
            />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedEmailId || "")}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-y-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
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
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors
        ${active 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"}
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {count ? (
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"}`}>
          {count}
        </span>
      ) : null}
    </button>
  );
}
