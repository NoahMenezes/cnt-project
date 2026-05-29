"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Key, Shield, Copy, Trash2, Search, ArrowLeft, Eye, EyeOff, Database, FileText, LockKeyhole
} from "lucide-react";
import { getKeys, deleteKey, CryptographicKey, syncKeysForUser } from "@/lib/store";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const NAV = [
  { title: "Home", href: "/" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Operation Lab", href: "/analyze" },
  { title: "Hybrid Lab", href: "/hybrid-lab" },
  { title: "Reports", href: "/reports" },
  { title: "Key Vault", href: "/vault", isActive: true },
  { title: "Visualizations", href: "/visualizations" },
  { title: "Profile", href: "/profile" },
];

function getFileIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF Document";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "Word Document";
  if (lower.endsWith(".csv")) return "CSV Spreadsheet";
  if (lower.endsWith(".json")) return "JSON Data File";
  return "Document";
}

export default function KeyVaultPage() {
  const { user } = useUser();
  const [keys, setKeys] = useState<CryptographicKey[]>([]);
  const [search, setSearch] = useState("");
  const [visibleKeyIds, setVisibleKeyIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.id) {
      syncKeysForUser(user.id);
    } else {
      syncKeysForUser("default-local-user");
    }
  }, [user]);

  useEffect(() => {
    // Populate state asynchronously on client mount
    const t = setTimeout(() => {
      setKeys(getKeys());
    }, 0);

    const handleUpdate = () => {
      setKeys(getKeys());
    };
    window.addEventListener("cipher_scope_db_update", handleUpdate);
    return () => {
      clearTimeout(t);
      window.removeEventListener("cipher_scope_db_update", handleUpdate);
    };
  }, []);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredKeys = keys.filter(
    (k) =>
      k.label.toLowerCase().includes(search.toLowerCase()) ||
      k.keyType.toLowerCase().includes(search.toLowerCase()) ||
      k.id.toLowerCase().includes(search.toLowerCase()) ||
      (k.documentName && k.documentName.toLowerCase().includes(search.toLowerCase()))
  );

  // Group keys into generation sessions (by document name and time)
  const groupedSessions = useMemo(() => {
    const sortedKeys = [...filteredKeys].sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
    
    const sessions: { id: string; docName: string; keys: CryptographicKey[]; latestTime: number }[] = [];
    
    sortedKeys.forEach((key) => {
      const doc = key.documentName || "Unassociated Keys";
      const keyTime = new Date(key.generatedAt).getTime();
      
      let added = false;
      for (const session of sessions) {
        if (session.docName === doc && Math.abs(session.latestTime - keyTime) < 5000) {
          session.keys.push(key);
          added = true;
          break;
        }
      }
      
      if (!added) {
        sessions.push({
          id: `${doc}_${keyTime}`,
          docName: doc,
          keys: [key],
          latestTime: keyTime
        });
      }
    });
    
    return sessions;
  }, [filteredKeys]);

  // Statistics
  const totalKeys = keys.length;
  const rsaKeysCount = keys.filter(k => k.keyType.startsWith("RSA")).length;
  const aesKeysCount = keys.filter(k => k.keyType === "AES_SESSION").length;

  return (
    <div className="relative min-h-screen bg-background">
      <Header navigationData={NAV} />

      <main className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          {/* Header Block */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Badge variant="outline" className="border-primary/30 text-primary mb-2">
                <Database className="h-3 w-3 mr-1" /> Cryptographic Storage
              </Badge>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Cryptographic Key Vault
              </h1>
              <p className="text-sm text-foreground/50 mt-1">
                Manage and retrieve secure keys generated across encryption pipelines, structured under their source documents.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/analyze">
                <Button variant="outline" size="sm" className="border-border/60 hover:bg-foreground/[0.04] rounded-xl flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Operation Lab
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Keys Stored", value: totalKeys, icon: Key, color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
              { label: "RSA Keys", value: rsaKeysCount, icon: Shield, color: "text-red-400 border-red-500/20 bg-red-500/5" },
              { label: "AES Session Keys", value: aesKeysCount, icon: LockKeyhole, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" }
            ].map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <div key={idx} className="rounded-xl border border-border/40 bg-background/50 p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-lg border ${stat.color}`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/40 font-semibold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
            <input
              type="text"
              placeholder="Search by document name or key label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-foreground/[0.02] border border-border/40 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Grouped Table Rows */}
          <div className="space-y-8">
            {groupedSessions.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border/40 rounded-2xl bg-background/20 text-foreground/40 space-y-3">
                <FileText className="h-10 w-10 mx-auto text-foreground/20" />
                <p className="font-semibold">No cryptographic keys found</p>
                <p className="text-xs text-foreground/30 max-w-sm mx-auto">
                  Go to the Operation Lab on the Analyze page to upload a document and generate RSA or AES keys.
                </p>
                <Link href="/analyze">
                  <Button className="mt-2 rounded-full gap-2">
                    <Key className="h-4 w-4" /> Start Generating Keys
                  </Button>
                </Link>
              </div>
            ) : (
              groupedSessions.map((session, docIdx) => {
                const docName = session.docName;
                const docKeys = session.keys;
                // Find any snippet to display what was in this document
                const snippet = docKeys.find(k => k.plaintextSnippet)?.plaintextSnippet;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: docIdx * 0.05 }}
                    className="rounded-2xl border border-border/30 bg-background/40 p-6 space-y-4 shadow-sm backdrop-blur"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/10 pb-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap">
                            {docName}
                            <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono">
                              {getFileIcon(docName)}
                            </Badge>
                          </h3>
                          <p className="text-xs text-foreground/40 mt-0.5">
                            {docKeys.length} associated cryptographic key{docKeys.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs border-border/40 text-foreground/50">
                          Last generated: {new Date(Math.max(...docKeys.map(k => new Date(k.generatedAt).getTime()))).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>

                    {/* Restored Document Preview Snippet */}
                    {snippet && (
                      <div className="bg-foreground/[0.02] border border-border/10 rounded-xl p-3.5 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-foreground/40">Restored Document Plaintext Preview</p>
                        <p className="text-xs font-mono text-foreground/60 line-clamp-2 leading-relaxed bg-background/30 p-2 rounded-lg border border-border/5">
                          {snippet}
                        </p>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/10 text-foreground/40 font-semibold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Key Type</th>
                            <th className="py-2.5 px-3">Label / ID</th>
                            <th className="py-2.5 px-3">Bit Strength</th>
                            <th className="py-2.5 px-3">Key Value / Modulus</th>
                            <th className="py-2.5 px-3">Created At</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docKeys.map((key) => {
                            const isVisible = visibleKeyIds[key.id] || key.keyType === "RSA_PUBLIC";

                            // Badge color/class per key type
                            let badgeStyle = "bg-blue-500/10 text-blue-300 border-blue-500/20";
                            let typeLabel = "RSA Public";
                            if (key.keyType === "RSA_PRIVATE") {
                              badgeStyle = "bg-red-500/10 text-red-300 border-red-500/20";
                              typeLabel = "RSA Private";
                            } else if (key.keyType === "AES_SESSION") {
                              badgeStyle = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                              typeLabel = "AES Session";
                            }

                            return (
                              <tr key={key.id} className="border-b border-border/5 hover:bg-foreground/[0.01] transition-colors">
                                <td className="py-3 px-3">
                                  <Badge variant="outline" className={`border ${badgeStyle} text-[10px]`}>
                                    {typeLabel}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3 font-medium">
                                  <div className="text-foreground font-semibold">{key.label}</div>
                                  <div className="text-[10px] text-foreground/30 mt-0.5 font-mono">{key.id}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <Badge variant="outline" className="bg-foreground/[0.03] text-[10px]">
                                    {key.keySize}-bit
                                  </Badge>
                                </td>
                                <td className="py-3 px-3 max-w-[280px]">
                                  <div className="flex items-center gap-2 bg-background/30 rounded-lg p-2 border border-border/10">
                                    <span className="font-mono text-[10px] truncate flex-1 block">
                                      {isVisible ? key.keyValue : "••••••••••••••••••••••••••••••••••••••••"}
                                    </span>
                                    {key.keyType !== "RSA_PUBLIC" && (
                                      <button
                                        type="button"
                                        onClick={() => toggleVisibility(key.id)}
                                        className="text-foreground/40 hover:text-foreground/75 transition-colors p-1"
                                        title={isVisible ? "Hide Key" : "Show Key"}
                                      >
                                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(key.keyValue)}
                                      className="text-foreground/40 hover:text-foreground/75 transition-colors p-1 border-l border-border/10 pl-1.5"
                                      title="Copy to Clipboard"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-foreground/50">
                                  {new Date(key.generatedAt).toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => deleteKey(key.id, user?.id || "default-local-user")}
                                    className="p-1.5 rounded-lg text-foreground/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    title="Delete Key Component"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
