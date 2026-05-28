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

const DEFAULT_REPORTS: Report[] = [
  {
    id: "rpt-001",
    fileName: "encrypted_document_v2.txt",
    type: "TXT",
    fileSize: "48.3 KB",
    analysisDate: "2024-06-14T14:32:07Z",
    securityScore: 34,
    status: "Critical",
    entropy: {
      value: 7.84,
      classification: "High",
      randomnessScore: 92,
      explanation: "Shannon entropy measures the average information content per character. A value approaching 8.0 indicates near-perfect randomness.",
      interpretation: "This file exhibits very high entropy, consistent with strongly encrypted or compressed data. Low-entropy regions were not detected, suggesting no plaintext leakage."
    },
    rsa: {
      keySize: 512,
      exponent: 3,
      publicExponent: 3,
      riskLevel: "Critical",
      vulnerabilities: [
        "Small key size (512-bit)",
        "Weak public exponent (e=3)",
        "Susceptible to low-exponent attack",
      ],
      securityAssessment: "This RSA configuration is critically weak. The 512-bit key is breakable within hours using commodity hardware.",
      modulusInfo: "512-bit modulus detected. Factorization risk is HIGH using modern algorithms."
    },
    aes: {
      keyStrength: "128-bit",
      mode: "ECB",
      encryptionMode: "ECB",
      passwordComplexity: "Weak",
      securityRecommendations: [
        "Use AES-256 instead of AES-128 for post-quantum resistance",
        "Replace ECB mode with GCM or CBC to prevent block-level pattern leakage",
        "Password 'password123' detected — must be replaced with a randomly generated key",
        "Implement PBKDF2 or Argon2 for key derivation"
      ]
    },
    patterns: {
      repeatedCharacters: true,
      repeatedSequences: ["4e6f7720697320746865", "48656c6c6f20576f726c"],
      blockRepetition: true,
      observations: "ECB mode encryption has produced visually identical ciphertext blocks for repeated plaintext blocks. This exposes plaintext structure through the ciphertext, a classic ECB mode vulnerability."
    },
    recommendations: [
      { priority: "Critical", action: "Increase RSA key size to minimum 2048 bits, preferably 4096 bits" },
      { priority: "Critical", action: "Replace public exponent e=3 with e=65537 (0x10001)" },
      { priority: "High", action: "Switch from AES-128-ECB to AES-256-GCM" }
    ],
    findings: "This file failed 4 of 6 security checks. Immediate re-encryption with secure configurations is strongly recommended.",
  },
  {
    id: "rpt-002",
    fileName: "user_database_export.csv",
    type: "CSV",
    fileSize: "128.4 KB",
    analysisDate: "2024-06-13T09:15:44Z",
    securityScore: 91,
    status: "Secure",
    entropy: {
      value: 7.96,
      classification: "High",
      randomnessScore: 98,
      explanation: "Shannon entropy measures the average information content per character.",
      interpretation: "This file exhibits extremely high entropy, consistent with strong encryption."
    },
    rsa: {
      keySize: 4096,
      exponent: 65537,
      publicExponent: 65537,
      riskLevel: "Low",
      vulnerabilities: [],
      securityAssessment: "Excellent RSA security parameters. Safe for long term data custody.",
      modulusInfo: "4096-bit modulus detected. No factorization risk identified."
    },
    aes: {
      keyStrength: "256-bit",
      mode: "GCM",
      encryptionMode: "GCM",
      passwordComplexity: "Strong",
      securityRecommendations: ["Consider rotating keys every 90 days"]
    },
    patterns: {
      repeatedCharacters: false,
      repeatedSequences: [],
      blockRepetition: false,
      observations: "No repeated block pattern detected. The cipher text appears fully random."
    },
    recommendations: [{ priority: "Low", action: "Consider rotating keys every 90 days" }],
    findings: "This file meets industry-standard security requirements. RSA-4096 with AES-256-GCM is an excellent configuration.",
  },
  {
    id: "rpt-003",
    fileName: "contract_signed.pdf",
    type: "PDF",
    fileSize: "1.2 MB",
    analysisDate: "2024-06-14T11:20:30Z",
    securityScore: 78,
    status: "Moderate",
    entropy: {
      value: 7.61,
      classification: "High",
      randomnessScore: 87,
      explanation: "Shannon entropy measures randomness.",
      interpretation: "High randomness indicates data is encrypted."
    },
    rsa: {
      keySize: 2048,
      exponent: 65537,
      publicExponent: 65537,
      riskLevel: "Low",
      vulnerabilities: [],
      securityAssessment: "Standard secure RSA configuration.",
      modulusInfo: "2048-bit modulus detected."
    },
    aes: {
      keyStrength: "128-bit",
      mode: "CBC",
      encryptionMode: "CBC",
      passwordComplexity: "Moderate",
      securityRecommendations: ["Upgrade to AES-256", "Use GCM mode for authenticated encryption"]
    },
    patterns: {
      repeatedCharacters: false,
      repeatedSequences: [],
      blockRepetition: false,
      observations: "No structural repetitions detected."
    },
    recommendations: [
      { priority: "Medium", action: "Upgrade to AES-256" },
      { priority: "Low", action: "Use GCM mode for authenticated encryption" }
    ],
    findings: "Configuration is acceptable for non-critical data but should be upgraded for sensitive documents.",
  },
  {
    id: "rpt-004",
    fileName: "session_tokens.txt",
    type: "TXT",
    fileSize: "12.8 KB",
    analysisDate: "2024-06-11T16:44:00Z",
    securityScore: 55,
    status: "Weak",
    entropy: {
      value: 6.20,
      classification: "Medium",
      randomnessScore: 71,
      explanation: "Shannon entropy is lower than standard encrypted files.",
      interpretation: "Lower entropy might indicate unencrypted blocks or high metadata ratio."
    },
    rsa: {
      keySize: 1024,
      exponent: 65537,
      publicExponent: 65537,
      riskLevel: "High",
      vulnerabilities: ["1024-bit key is deprecated"],
      securityAssessment: "1024-bit RSA key is weak and vulnerable to state-sponsored factoring.",
      modulusInfo: "1024-bit modulus detected."
    },
    aes: {
      keyStrength: "128-bit",
      mode: "CBC",
      encryptionMode: "CBC",
      passwordComplexity: "Moderate",
      securityRecommendations: ["Upgrade RSA key to at least 2048-bit", "Consider AES-256-GCM for session tokens"]
    },
    patterns: {
      repeatedCharacters: true,
      repeatedSequences: ["2f5a6b8c"],
      blockRepetition: false,
      observations: "Some metadata repetitions detected."
    },
    recommendations: [
      { priority: "High", action: "Upgrade RSA key to at least 2048-bit" },
      { priority: "Medium", action: "Consider AES-256-GCM for session tokens" }
    ],
    findings: "Session token file uses a deprecated 1024-bit RSA key. This configuration poses significant risk for token forgery.",
  },
  {
    id: "rpt-005",
    fileName: "encrypted_backup.docx",
    type: "DOCX",
    fileSize: "820 KB",
    analysisDate: "2024-06-10T08:30:00Z",
    securityScore: 88,
    status: "Secure",
    entropy: {
      value: 7.91,
      classification: "High",
      randomnessScore: 95,
      explanation: "Excellent entropy value indicating strong ciphertext.",
      interpretation: "No plaintext leakage patterns identified."
    },
    rsa: {
      keySize: 4096,
      exponent: 65537,
      publicExponent: 65537,
      riskLevel: "Low",
      vulnerabilities: [],
      securityAssessment: "RSA configuration is secure.",
      modulusInfo: "4096-bit modulus."
    },
    aes: {
      keyStrength: "256-bit",
      mode: "GCM",
      encryptionMode: "GCM",
      passwordComplexity: "Strong",
      securityRecommendations: ["Excellent configuration — maintain current practices"]
    },
    patterns: {
      repeatedCharacters: false,
      repeatedSequences: [],
      blockRepetition: false,
      observations: "No repeating blocks."
    },
    recommendations: [{ priority: "Low", action: "Excellent configuration — maintain current practices" }],
    findings: "Backup file uses strong RSA-4096 and AES-256-GCM. No critical issues found.",
  }
];

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
