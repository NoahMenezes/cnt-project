"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Key, Shield, Lock, Copy, Trash2, Search, ArrowLeft, Eye, EyeOff, Database
} from "lucide-react";
import { getKeys, deleteKey, CryptographicKey } from "@/lib/store";
import Link from "next/link";

const NAV = [
  { title: "Home", href: "/" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Operation Lab", href: "/analyze" },
  { title: "Hybrid Lab", href: "/hybrid-lab" },
  { title: "Reports", href: "/reports" },
  { title: "Key Vault", href: "/vault", isActive: true },
  { title: "Profile", href: "/profile" },
];

export default function KeyVaultPage() {
  const [keys, setKeys] = useState<CryptographicKey[]>(() => getKeys());
  const [search, setSearch] = useState("");
  const [visibleKeyIds, setVisibleKeyIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleUpdate = () => {
      setKeys(getKeys());
    };
    window.addEventListener("cipher_scope_db_update", handleUpdate);
    return () => window.removeEventListener("cipher_scope_db_update", handleUpdate);
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
      k.id.toLowerCase().includes(search.toLowerCase())
  );

  // Group keys into the 3 categories/subrows
  const rsaPublicKeys = filteredKeys.filter((k) => k.keyType === "RSA_PUBLIC");
  const rsaPrivateKeys = filteredKeys.filter((k) => k.keyType === "RSA_PRIVATE");
  const aesSessionKeys = filteredKeys.filter((k) => k.keyType === "AES_SESSION");

  const categories = [
    {
      title: "RSA Public Keys",
      subtitle: "Asymmetric public components used for payload and session key wrapping",
      icon: Shield,
      colorClass: "text-blue-400 border-blue-500/20 bg-blue-500/5",
      badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
      data: rsaPublicKeys,
    },
    {
      title: "RSA Private Keys",
      subtitle: "Sensitive asymmetric private components used for key decryption (KEEP SECURE)",
      icon: Lock,
      colorClass: "text-red-400 border-red-500/20 bg-red-500/5",
      badgeColor: "bg-red-500/10 text-red-300 border-red-500/20",
      data: rsaPrivateKeys,
    },
    {
      title: "AES Session Keys",
      subtitle: "Symmetric key components used for rapid payload block encryption",
      icon: Key,
      colorClass: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      data: aesSessionKeys,
    },
  ];

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
                Manage, audit, and retrieve secure keys generated across encryption pipelines. Grouped by cryptosystem layers.
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
            {categories.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <div key={idx} className="rounded-xl border border-border/40 bg-background/50 p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-lg border ${cat.colorClass}`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/40 font-semibold uppercase tracking-wider">{cat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{cat.data.length}</p>
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
              placeholder="Search keys by label or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-foreground/[0.02] border border-border/40 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Grouped Table Rows */}
          <div className="space-y-6">
            {categories.map((category, catIdx) => {
              const IconComp = category.icon;
              return (
                <motion.div
                  key={catIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: catIdx * 0.1 }}
                  className="rounded-2xl border border-border/30 bg-background/40 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${category.colorClass}`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{category.title}</h3>
                        <p className="text-xs text-foreground/40">{category.subtitle}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`border ${category.badgeColor}`}>
                      {category.data.length} Stored
                    </Badge>
                  </div>

                  {category.data.length === 0 ? (
                    <div className="text-center py-6 text-xs text-foreground/30">
                      No active {category.title.toLowerCase()} matching the current view.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/10 text-foreground/40 font-semibold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Label / ID</th>
                            <th className="py-2.5 px-3">Bit Strength</th>
                            <th className="py-2.5 px-3">Key Modulus / Secret Value</th>
                            <th className="py-2.5 px-3">Created At</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.data.map((key) => {
                            const isVisible = visibleKeyIds[key.id] || key.keyType === "RSA_PUBLIC";
                            return (
                              <tr key={key.id} className="border-b border-border/5 hover:bg-foreground/[0.01] transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-foreground">{key.label}</div>
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
                                    onClick={() => deleteKey(key.id)}
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
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
