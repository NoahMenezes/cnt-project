"use client";

import { supabase } from "@/lib/supabase";

export interface Report {
  id: string;
  fileName: string;
  type: string;
  fileSize: string;
  analysisDate: string;
  securityScore: number;
  status: string;
  entropy: {
    value: number;
    classification: string;
    randomnessScore: number;
    explanation: string;
    interpretation: string;
  };
  rsa: {
    keySize: number;
    exponent: number;
    publicExponent: number;
    riskLevel: string;
    vulnerabilities: string[];
    securityAssessment: string;
    modulusInfo: string;
  };
  aes: {
    keyStrength: string;
    mode: string;
    encryptionMode: string;
    passwordComplexity: string;
    securityRecommendations: string[];
  };
  patterns: {
    repeatedCharacters: boolean;
    repeatedSequences: string[];
    blockRepetition: boolean;
    observations: string;
    unstructuredChunks?: { id: number; type: string; text: string; length: number }[];
    structuredParameters?: { category: string; element: string; value: string; classification: string; status: string }[];
  };
  recommendations: { priority: string; action: string }[];
  findings: string;
}

let cachedReports: Report[] = [];
let isAuthInitialized = false;

// Function to trigger update events to keep components reactive
function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cipher_scope_db_update"));
  }
}

// Load initial guest/local storage fallback and listen for Supabase auth state changes
if (typeof window !== "undefined" && !isAuthInitialized) {
  isAuthInitialized = true;
  
  try {
    const local = localStorage.getItem("cipher_scope_reports_db");
    if (local) cachedReports = JSON.parse(local);
  } catch {}

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Fetch authenticated user's reports from Supabase database
      const { data } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        cachedReports = data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          fileName: row.file_name as string,
          type: row.type as string,
          fileSize: row.file_size as string,
          analysisDate: row.analysis_date as string,
          securityScore: row.security_score as number,
          status: row.status as string,
          entropy: row.entropy as Report["entropy"],
          rsa: row.rsa as Report["rsa"],
          aes: row.aes as Report["aes"],
          patterns: row.patterns as Report["patterns"],
          recommendations: row.recommendations as Report["recommendations"],
          findings: row.findings as string,
        }));
        notifyUpdate();
      }
    } else {
      // Fallback to local storage reports if logged out
      try {
        const local = localStorage.getItem("cipher_scope_reports_db");
        cachedReports = local ? JSON.parse(local) : [];
      } catch {
        cachedReports = [];
      }
      notifyUpdate();
    }
  });
}

export function getReports(): Report[] {
  return cachedReports;
}

export function saveReport(report: Report): void {
  // 1. Optimistic local cache save
  cachedReports = [report, ...cachedReports.filter((r) => r.id !== report.id)];
  notifyUpdate();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cipher_scope_reports_db", JSON.stringify(cachedReports));
    } catch {}

    // 2. Async database sync
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from("reports")
          .upsert({
            id: report.id,
            user_id: session.user.id,
            file_name: report.fileName,
            type: report.type,
            file_size: report.fileSize,
            analysis_date: report.analysisDate,
            security_score: report.securityScore,
            status: report.status,
            entropy: report.entropy,
            rsa: report.rsa,
            aes: report.aes,
            patterns: report.patterns,
            recommendations: report.recommendations,
            findings: report.findings,
          })
          .then(({ error }) => {
            if (error) console.error("Failed to sync report to Supabase:", error);
          });
      }
    });
  }
}

export function deleteReport(id: string): void {
  // 1. Optimistic local cache delete
  cachedReports = cachedReports.filter((r) => r.id !== id);
  notifyUpdate();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cipher_scope_reports_db", JSON.stringify(cachedReports));
    } catch {}

    // 2. Async database delete
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from("reports")
          .delete()
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Failed to delete report from Supabase:", error);
          });
      }
    });
  }
}

// ─── Key Management ──────────────────────────────────────────
export interface CryptographicKey {
  id: string;
  keyType: "RSA_PUBLIC" | "RSA_PRIVATE" | "AES_SESSION";
  keyValue: string;
  keySize: number;
  label: string;
  generatedAt: string;
  description?: string;
}

let cachedKeys: CryptographicKey[] = [];

// Initialize key loading
if (typeof window !== "undefined") {
  try {
    const localKeys = localStorage.getItem("cipher_scope_keys_db");
    if (localKeys) cachedKeys = JSON.parse(localKeys);
  } catch {}

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { data } = await supabase
        .from("cryptographic_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        cachedKeys = data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          keyType: row.key_type as CryptographicKey["keyType"],
          keyValue: row.key_value as string,
          keySize: row.key_size as number,
          label: row.label as string,
          generatedAt: row.generated_at as string,
          description: row.description as string,
        }));
        notifyUpdate();
      }
    } else {
      try {
        const localKeys = localStorage.getItem("cipher_scope_keys_db");
        cachedKeys = localKeys ? JSON.parse(localKeys) : [];
      } catch {
        cachedKeys = [];
      }
      notifyUpdate();
    }
  });
}

export function getKeys(): CryptographicKey[] {
  return cachedKeys;
}

export function saveKey(key: CryptographicKey): void {
  cachedKeys = [key, ...cachedKeys.filter((k) => k.id !== key.id)];
  notifyUpdate();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cipher_scope_keys_db", JSON.stringify(cachedKeys));
    } catch {}

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from("cryptographic_keys")
          .upsert({
            id: key.id,
            user_id: session.user.id,
            key_type: key.keyType,
            key_value: key.keyValue,
            key_size: key.keySize,
            label: key.label,
            generated_at: key.generatedAt,
            description: key.description,
          })
          .then(({ error }) => {
            if (error) console.error("Failed to sync key to Supabase:", error);
          });
      }
    });
  }
}

export function deleteKey(id: string): void {
  cachedKeys = cachedKeys.filter((k) => k.id !== id);
  notifyUpdate();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cipher_scope_keys_db", JSON.stringify(cachedKeys));
    } catch {}

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from("cryptographic_keys")
          .delete()
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Failed to delete key from Supabase:", error);
          });
      }
    });
  }
}

export function getStats() {
  const reports = getReports();
  const totalFiles = reports.length;
  
  const avgSecurityScore = totalFiles > 0
    ? parseFloat((reports.reduce((acc, r) => acc + r.securityScore, 0) / totalFiles).toFixed(1))
    : 0;

  // RSA Key Size distribution
  let rsa4096 = 0;
  let rsa2048 = 0;
  let rsaWeak = 0;

  reports.forEach((r) => {
    if (r.rsa.keySize >= 4096) rsa4096++;
    else if (r.rsa.keySize >= 2048) rsa2048++;
    else rsaWeak++;
  });

  const totalRsa = rsa4096 + rsa2048 + rsaWeak || 1;

  // File categories count
  const fileCategories: Record<string, number> = {};
  reports.forEach((r) => {
    const cat = r.type + " Files";
    fileCategories[cat] = (fileCategories[cat] || 0) + 1;
  });

  const formattedCategories = Object.entries(fileCategories).map(([label, value]) => ({
    label,
    value: value.toString(),
    subtitle: `${value} file${value > 1 ? "s" : ""}`
  }));

  // Vulnerability counts
  const vulnerabilitiesCount = reports.reduce((acc, r) => acc + r.rsa.vulnerabilities.length, 0);

  return {
    totalFiles,
    avgSecurityScore,
    vulnerabilitiesCount,
    rsaDistribution: [
      { label: "4096-bit Keys", value: `${Math.round((rsa4096 / totalRsa) * 100)}%`, subtitle: "secure key size" },
      { label: "2048-bit Keys", value: `${Math.round((rsa2048 / totalRsa) * 100)}%`, subtitle: "standard key size" },
      { label: "1024-bit / Less", value: `${Math.round((rsaWeak / totalRsa) * 100)}%`, subtitle: "deprecated/weak size" },
    ],
    fileCategories: formattedCategories.slice(0, 3),
    recentEvents: reports.slice(0, 3).map((r) => ({
      label: r.status === "Critical" || r.status === "Weak" ? "RSA Weak Modulus Flagged" : "File Analyzed",
      value: "Just now",
      subtitle: r.fileName
    }))
  };
}
