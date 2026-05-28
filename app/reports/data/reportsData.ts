export interface ReportEntropy {
  value: number;
  classification: string;
  randomnessScore: number;
}

export interface ReportRSA {
  keySize: number;
  exponent: number;
  riskLevel: string;
  vulnerabilities: string[];
}

export interface ReportAES {
  keyStrength: string;
  mode: string;
  passwordComplexity: string;
}

export interface Report {
  id: string;
  fileName: string;
  type: string;
  analysisDate: string;
  securityScore: number;
  status: string;
  entropy: ReportEntropy;
  rsa: ReportRSA;
  aes: ReportAES;
  recommendations: string[];
  findings: string;
}

export interface ReportsData {
  reports: Report[];
}

const reportsData: ReportsData = {
  reports: [
    {
      id: "rpt-001",
      fileName: "encrypted_document_v2.txt",
      type: "TXT",
      analysisDate: "2024-06-14T14:32:07Z",
      securityScore: 34,
      status: "Critical",
      entropy: { value: 7.84, classification: "High", randomnessScore: 92 },
      rsa: {
        keySize: 512,
        exponent: 3,
        riskLevel: "Critical",
        vulnerabilities: [
          "Small key size (512-bit)",
          "Weak public exponent (e=3)",
          "Susceptible to low-exponent attack",
        ],
      },
      aes: { keyStrength: "128-bit", mode: "ECB", passwordComplexity: "Weak" },
      recommendations: [
        "Increase RSA key to 4096-bit",
        "Replace ECB with GCM",
        "Use a strong random password",
      ],
      findings:
        "This file failed 4 of 6 security checks. Immediate re-encryption with secure configurations is strongly recommended.",
    },
    {
      id: "rpt-002",
      fileName: "user_database_export.csv",
      type: "CSV",
      analysisDate: "2024-06-13T09:15:44Z",
      securityScore: 91,
      status: "Secure",
      entropy: { value: 7.96, classification: "High", randomnessScore: 98 },
      rsa: {
        keySize: 4096,
        exponent: 65537,
        riskLevel: "Low",
        vulnerabilities: [],
      },
      aes: { keyStrength: "256-bit", mode: "GCM", passwordComplexity: "Strong" },
      recommendations: ["Consider rotating keys every 90 days"],
      findings:
        "This file meets industry-standard security requirements. RSA-4096 with AES-256-GCM is an excellent configuration.",
    },
    {
      id: "rpt-003",
      fileName: "contract_signed.pdf",
      type: "PDF",
      analysisDate: "2024-06-14T11:20:30Z",
      securityScore: 78,
      status: "Moderate",
      entropy: { value: 7.61, classification: "High", randomnessScore: 87 },
      rsa: {
        keySize: 2048,
        exponent: 65537,
        riskLevel: "Low",
        vulnerabilities: [],
      },
      aes: { keyStrength: "128-bit", mode: "CBC", passwordComplexity: "Moderate" },
      recommendations: [
        "Upgrade to AES-256",
        "Use GCM mode for authenticated encryption",
      ],
      findings:
        "Configuration is acceptable for non-critical data but should be upgraded for sensitive documents.",
    },
    {
      id: "rpt-004",
      fileName: "session_tokens.txt",
      type: "TXT",
      analysisDate: "2024-06-11T16:44:00Z",
      securityScore: 55,
      status: "Weak",
      entropy: { value: 6.2, classification: "Medium", randomnessScore: 71 },
      rsa: {
        keySize: 1024,
        exponent: 65537,
        riskLevel: "High",
        vulnerabilities: ["1024-bit key is deprecated"],
      },
      aes: { keyStrength: "128-bit", mode: "CBC", passwordComplexity: "Moderate" },
      recommendations: [
        "Upgrade RSA key to at least 2048-bit",
        "Consider AES-256-GCM for session tokens",
      ],
      findings:
        "Session token file uses a deprecated 1024-bit RSA key. This configuration poses significant risk for token forgery.",
    },
    {
      id: "rpt-005",
      fileName: "encrypted_backup.docx",
      type: "DOCX",
      analysisDate: "2024-06-10T08:30:00Z",
      securityScore: 88,
      status: "Secure",
      entropy: { value: 7.91, classification: "High", randomnessScore: 95 },
      rsa: {
        keySize: 4096,
        exponent: 65537,
        riskLevel: "Low",
        vulnerabilities: [],
      },
      aes: { keyStrength: "256-bit", mode: "GCM", passwordComplexity: "Strong" },
      recommendations: ["Excellent configuration — maintain current practices"],
      findings:
        "Backup file uses strong RSA-4096 and AES-256-GCM. No critical issues found.",
    },
  ],
};

export default reportsData;
