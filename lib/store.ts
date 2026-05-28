"use client";

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
    publicExponent: number; // dual support
    riskLevel: string;
    vulnerabilities: string[];
    securityAssessment: string;
    modulusInfo: string;
  };
  aes: {
    keyStrength: string;
    mode: string;
    encryptionMode: string; // dual support
    passwordComplexity: string;
    securityRecommendations: string[];
  };
  patterns: {
    repeatedCharacters: boolean;
    repeatedSequences: string[];
    blockRepetition: boolean;
    observations: string;
  };
  recommendations: { priority: string; action: string }[];
  findings: string;
}

const DEFAULT_REPORTS: Report[] = [];

const STORAGE_KEY = "cipher_scope_reports_db";

export function getReports(): Report[] {
  if (typeof window === "undefined") return DEFAULT_REPORTS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REPORTS));
      return DEFAULT_REPORTS;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_REPORTS;
  }
}

export function saveReport(report: Report): void {
  if (typeof window === "undefined") return;
  try {
    const reports = getReports();
    // Prepend new report
    const updated = [report, ...reports.filter((r) => r.id !== report.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save report to local storage", e);
  }
}

export function deleteReport(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const reports = getReports();
    const updated = reports.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete report", e);
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
