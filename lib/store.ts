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
let isStoreInitialized = false;

// Dispatch update events to keep components reactive
function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cipher_scope_db_update"));
  }
}

// Load from localStorage on startup (Clerk userId fetched per-operation via API)
if (typeof window !== "undefined" && !isStoreInitialized) {
  isStoreInitialized = true;
  try {
    const local = localStorage.getItem("cipher_scope_reports_db");
    if (local) cachedReports = JSON.parse(local);
  } catch {}
}

export function toUuid(id: string): string {
  if (!id) return "00000000-0000-0000-0000-000000000000";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  let h1 = 0x811c9dc5;
  let h2 = 0xc9dc511c;
  let h3 = 0x511cc9dc;
  let h4 = 0xdc511c9d;

  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 0x01000193);
    h2 = Math.imul(h2 ^ (char >> 1), 0x01000193);
    h3 = Math.imul(h3 ^ (char >> 2), 0x01000193);
    h4 = Math.imul(h4 ^ (char >> 3), 0x01000193);
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  const hex1 = toHex(h1);
  const hex2 = toHex(h2);
  const hex3 = toHex(h3);
  const hex4 = toHex(h4);

  const part1 = hex1;
  const part2 = hex2.substring(0, 4);
  const part3 = "4" + hex2.substring(5, 8);
  const part4 = "8" + hex3.substring(1, 4);
  const part5 = hex3.substring(4, 8) + hex4.substring(0, 8);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

/** Call this once after Clerk user loads to pull Supabase records for that user */
export async function syncReportsForUser(clerkUserId: string) {
  const dbUserId = toUuid(clerkUserId);
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", dbUserId)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.warn("Failed to sync reports:", error.message);
    return;
  }
  
  if (data && data.length > 0) {
    const remoteReports = data.map((row: Record<string, unknown>) => ({
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
    
    // Merge remote reports with local cachedReports, prioritizing remote data
    const localMap = new Map(cachedReports.map(r => [r.id, r]));
    remoteReports.forEach(r => localMap.set(r.id, r));
    cachedReports = Array.from(localMap.values()).sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());
    
    try {
      localStorage.setItem("cipher_scope_reports_db", JSON.stringify(cachedReports));
    } catch {}
    notifyUpdate();
  }
}

export function getReports(): Report[] {
  return cachedReports;
}

export function saveReport(report: Report, clerkUserId?: string): void {
  cachedReports = [report, ...cachedReports.filter((r) => r.id !== report.id)];
  notifyUpdate();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cipher_scope_reports_db", JSON.stringify(cachedReports));
    } catch {}

    if (clerkUserId) {
      const dbUserId = toUuid(clerkUserId);
      supabase
        .from("reports")
        .upsert({
          id: report.id,
          user_id: dbUserId,
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
          if (error) {
            // Ignored RLS errors on anonymous sync; local store already has the data
          }
        });
    }
  }
}

export function deleteReport(id: string, clerkUserId?: string): void {
  cachedReports = cachedReports.filter((r) => r.id !== id);
  notifyUpdate();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cipher_scope_reports_db", JSON.stringify(cachedReports));
    } catch {}

    if (clerkUserId) {
      supabase
        .from("reports")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) {
            // Ignored RLS errors on anonymous sync; local store already has the data
          }
        });
    }
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
  plaintextSnippet?: string;
  ciphertextPayload?: string;
  encryptedSessionKey?: string;
  aesIV?: string;
  aesMode?: string;
  pairedKeyId?: string;
  documentName?: string;
}

let cachedKeys: CryptographicKey[] = [];
let isKeysInitialized = false;

if (typeof window !== "undefined" && !isKeysInitialized) {
  isKeysInitialized = true;
  try {
    const localKeys = localStorage.getItem("cipher_scope_keys_db");
    if (localKeys) cachedKeys = JSON.parse(localKeys);
  } catch {}
}

interface CryptographicKeyV2Row {
  id: string;
  key_type: string;
  key_value: string;
  key_size: number;
  label: string;
  generated_at: string;
  description?: string;
  document_name?: string;
  plaintext_snippet?: string;
  ciphertext_payload?: string;
  encrypted_session_key?: string;
  aes_iv?: string;
  aes_mode?: string;
  paired_key_id?: string;
}

function mapV2Row(row: unknown): CryptographicKey {
  const r = row as CryptographicKeyV2Row;
  return {
    id: r.id,
    keyType: r.key_type as CryptographicKey["keyType"],
    keyValue: r.key_value,
    keySize: r.key_size,
    label: r.label,
    generatedAt: r.generated_at,
    description: r.description || "",
    documentName: r.document_name || "",
    plaintextSnippet: r.plaintext_snippet || "",
    ciphertextPayload: r.ciphertext_payload || "",
    encryptedSessionKey: r.encrypted_session_key || "",
    aesIV: r.aes_iv || "",
    aesMode: r.aes_mode || "",
    pairedKeyId: r.paired_key_id || "",
  };
}

function mapV1Row(row: Record<string, unknown>): CryptographicKey {
  let desc = row.description as string || "";
  let docName = "";
  let pSnippet = "";
  let cPayload = "";
  let encSessionKey = "";
  let iv = "";
  let mode = "";
  let pairedId = "";

  if (desc.startsWith("METADATA_JSON:")) {
    try {
      const parsed = JSON.parse(desc.substring(14));
      desc = parsed.description || "";
      docName = parsed.documentName || "";
      pSnippet = parsed.plaintextSnippet || "";
      cPayload = parsed.ciphertextPayload || "";
      encSessionKey = parsed.encryptedSessionKey || "";
      iv = parsed.aesIV || "";
      mode = parsed.aesMode || "";
      pairedId = parsed.pairedKeyId || "";
    } catch {}
  }

  return {
    id: row.id as string,
    keyType: row.key_type as CryptographicKey["keyType"],
    keyValue: row.key_value as string,
    keySize: row.key_size as number,
    label: row.label as string,
    generatedAt: row.generated_at as string,
    description: desc,
    documentName: docName,
    plaintextSnippet: pSnippet,
    ciphertextPayload: cPayload,
    encryptedSessionKey: encSessionKey,
    aesIV: iv,
    aesMode: mode,
    pairedKeyId: pairedId,
  };
}

/** Call once after Clerk user loads to pull Supabase keys for that user */
export async function syncKeysForUser(clerkUserId: string) {
  const dbUserId = toUuid(clerkUserId);
  
  // Try querying structured V2 table first
  const { data: dataV2, error: errV2 } = await supabase
    .from("cryptographic_keys_v2")
    .select("*")
    .eq("user_id", dbUserId)
    .order("created_at", { ascending: false });

  if (errV2) {
    // Only fall back to legacy V1 table if the V2 relation does not exist (error 42P01)
    if (errV2.code === "42P01") {
      const { data: dataV1, error: errV1 } = await supabase
        .from("cryptographic_keys")
        .select("*")
        .eq("user_id", dbUserId)
        .order("created_at", { ascending: false });

      if (errV1 && errV1.code !== "42P01") {
        console.warn("Failed to query legacy cryptographic_keys table:", errV1.message);
      }
      if (dataV1 && dataV1.length > 0) {
        const remoteKeys = dataV1.map(mapV1Row);
        const localMap = new Map(cachedKeys.map(k => [k.id, k]));
        remoteKeys.forEach(k => localMap.set(k.id, k));
        cachedKeys = Array.from(localMap.values()).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        try {
          localStorage.setItem("cipher_scope_keys_db", JSON.stringify(cachedKeys));
        } catch {}
        notifyUpdate();
      }
    } else {
      console.warn("Failed to query cryptographic_keys_v2 table:", errV2.message);
    }
    return;
  }

  if (dataV2 && dataV2.length > 0) {
    const remoteKeys = dataV2.map(mapV2Row);
    const localMap = new Map(cachedKeys.map(k => [k.id, k]));
    remoteKeys.forEach(k => localMap.set(k.id, k));
    cachedKeys = Array.from(localMap.values()).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    try {
      localStorage.setItem("cipher_scope_keys_db", JSON.stringify(cachedKeys));
    } catch {}
    notifyUpdate();
    return;
  }

  // V2 relation exists but is empty; check if there are legacy keys to import
  const { data: dataV1, error: errV1 } = await supabase
    .from("cryptographic_keys")
    .select("*")
    .eq("user_id", dbUserId)
    .order("created_at", { ascending: false });

  if (errV1 && errV1.code !== "42P01") {
    console.warn("Failed to query legacy cryptographic_keys table:", errV1.message);
  }
  if (dataV1 && dataV1.length > 0) {
    const remoteKeys = dataV1.map(mapV1Row);
    const localMap = new Map(cachedKeys.map(k => [k.id, k]));
    remoteKeys.forEach(k => localMap.set(k.id, k));
    cachedKeys = Array.from(localMap.values()).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    try {
      localStorage.setItem("cipher_scope_keys_db", JSON.stringify(cachedKeys));
    } catch {}
    notifyUpdate();
  }
}

export function getKeys(): CryptographicKey[] {
  return cachedKeys;
}

export function saveKey(key: CryptographicKey, clerkUserId?: string): void {
  cachedKeys = [key, ...cachedKeys.filter((k) => k.id !== key.id)];
  notifyUpdate();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cipher_scope_keys_db", JSON.stringify(cachedKeys));
    } catch {}

    if (clerkUserId) {
      const dbUserId = toUuid(clerkUserId);
      // First try to insert into cryptographic_keys_v2 (structured format)
      supabase
        .from("cryptographic_keys_v2")
        .upsert({
          id: key.id,
          user_id: dbUserId,
          key_type: key.keyType,
          key_value: key.keyValue,
          key_size: key.keySize,
          label: key.label,
          description: key.description || "",
          document_name: key.documentName || "",
          plaintext_snippet: key.plaintextSnippet || "",
          ciphertext_payload: key.ciphertextPayload || "",
          encrypted_session_key: key.encryptedSessionKey || "",
          aes_iv: key.aesIV || "",
          aes_mode: key.aesMode || "",
          paired_key_id: key.pairedKeyId || "",
          generated_at: key.generatedAt,
        })
        .then(({ error }) => {
          if (error) {
            // Fallback to legacy v1 table with serialized metadata JSON string
            const meta = {
              description: key.description,
              documentName: key.documentName,
              plaintextSnippet: key.plaintextSnippet,
              ciphertextPayload: key.ciphertextPayload,
              encryptedSessionKey: key.encryptedSessionKey,
              aesIV: key.aesIV,
              aesMode: key.aesMode,
              pairedKeyId: key.pairedKeyId,
            };
            const descVal = "METADATA_JSON:" + JSON.stringify(meta);
            supabase
              .from("cryptographic_keys")
              .upsert({
                id: key.id,
                user_id: dbUserId,
                key_type: key.keyType,
                key_value: key.keyValue,
                key_size: key.keySize,
                label: key.label,
                generated_at: key.generatedAt,
                description: descVal,
              })
              .then(({ error: errV1 }) => {
                if (errV1 && errV1.code !== '42P01') {
                  console.warn("Failed to sync key to legacy cryptographic_keys table:", errV1.message);
                }
              });
          }
        });
    }
  }
}

export function deleteKey(id: string, clerkUserId?: string): void {
  cachedKeys = cachedKeys.filter((k) => k.id !== id);
  notifyUpdate();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cipher_scope_keys_db", JSON.stringify(cachedKeys));
    } catch {}

    if (clerkUserId) {
      // Delete from both v2 and v1 tables
      supabase
        .from("cryptographic_keys_v2")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Failed to delete key from cryptographic_keys_v2:", error.message);
        });

      supabase
        .from("cryptographic_keys")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          // Suppress error log for legacy table as it may have been dropped or has restrictive RLS
          if (error && error.code !== '42P01') {
            console.warn("Note: Could not delete from legacy cryptographic_keys table.", error.message);
          }
        });
    }
  }
}

export function getStats() {
  const reports = getReports();
  const totalFiles = reports.length;

  const avgSecurityScore =
    totalFiles > 0
      ? parseFloat(
          (reports.reduce((acc, r) => acc + r.securityScore, 0) / totalFiles).toFixed(1)
        )
      : 0;

  let rsa4096 = 0;
  let rsa2048 = 0;
  let rsaWeak = 0;

  reports.forEach((r) => {
    if (r.rsa.keySize >= 4096) rsa4096++;
    else if (r.rsa.keySize >= 2048) rsa2048++;
    else rsaWeak++;
  });

  const totalRsa = rsa4096 + rsa2048 + rsaWeak || 1;

  const fileCategories: Record<string, number> = {};
  reports.forEach((r) => {
    const cat = r.type + " Files";
    fileCategories[cat] = (fileCategories[cat] || 0) + 1;
  });

  const formattedCategories = Object.entries(fileCategories).map(([label, value]) => ({
    label,
    value: value.toString(),
    subtitle: `${value} file${value > 1 ? "s" : ""}`,
  }));

  const vulnerabilitiesCount = reports.reduce(
    (acc, r) => acc + r.rsa.vulnerabilities.length,
    0
  );

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
      label:
        r.status === "Critical" || r.status === "Weak"
          ? "RSA Weak Modulus Flagged"
          : "File Analyzed",
      value: "Just now",
      subtitle: r.fileName,
    })),
  };
}
