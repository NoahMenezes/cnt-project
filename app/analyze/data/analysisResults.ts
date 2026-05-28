export interface FileInfo {
  fileName: string;
  fileExtension: string;
  fileSize: string;
  uploadDate: string;
  uploadTime: string;
  fileCategory: string;
  estimatedContentType: string;
}

export interface EntropyResult {
  value: number;
  randomnessScore: number;
  classification: string;
  explanation: string;
  interpretation: string;
}

export interface RSAResult {
  keySize: number;
  publicExponent: number;
  modulusInfo: string;
  vulnerabilities: string[];
  securityAssessment: string;
  riskLevel: string;
}

export interface AESResult {
  keyStrength: string;
  passwordComplexity: string;
  encryptionMode: string;
  securityRecommendations: string[];
}

export interface PatternResult {
  repeatedCharacters: boolean;
  repeatedSequences: string[];
  blockRepetition: boolean;
  observations: string;
}

export interface ScoreBreakdown {
  rsaScore: number;
  aesScore: number;
  entropyScore: number;
  patternScore: number;
}

export interface SecurityScore {
  overall: number;
  riskClassification: string;
  breakdown: ScoreBreakdown;
}

export interface Recommendation {
  priority: string;
  action: string;
}

export interface CurrentAnalysis {
  fileInfo: FileInfo;
  entropy: EntropyResult;
  rsa: RSAResult;
  aes: AESResult;
  patterns: PatternResult;
  securityScore: SecurityScore;
  recommendations: Recommendation[];
}

export interface RecentAnalysis {
  id: string;
  fileName: string;
  date: string;
  score: number;
  status: string;
}

export interface AnalysisData {
  currentAnalysis: CurrentAnalysis;
  recentAnalyses: RecentAnalysis[];
}

const analysisResults: AnalysisData = {
  currentAnalysis: {
    fileInfo: {
      fileName: "encrypted_document_v2.txt",
      fileExtension: ".txt",
      fileSize: "48.3 KB",
      uploadDate: "2024-06-14",
      uploadTime: "14:32:07",
      fileCategory: "Text Document",
      estimatedContentType: "Base64-encoded ciphertext",
    },
    entropy: {
      value: 7.84,
      randomnessScore: 92,
      classification: "High",
      explanation:
        "Shannon entropy measures the average information content per character. A value approaching 8.0 indicates near-perfect randomness.",
      interpretation:
        "This file exhibits very high entropy, consistent with strongly encrypted or compressed data. Low-entropy regions were not detected, suggesting no plaintext leakage.",
    },
    rsa: {
      keySize: 512,
      publicExponent: 3,
      modulusInfo:
        "512-bit modulus detected. Factorization risk is HIGH using modern algorithms.",
      vulnerabilities: [
        "Small key size (512-bit)",
        "Weak public exponent (e=3)",
        "Susceptible to low-exponent attack",
      ],
      securityAssessment:
        "This RSA configuration is critically weak. The 512-bit key is breakable within hours using commodity hardware.",
      riskLevel: "Critical",
    },
    aes: {
      keyStrength: "128-bit",
      passwordComplexity: "Weak",
      encryptionMode: "ECB",
      securityRecommendations: [
        "Use AES-256 instead of AES-128 for post-quantum resistance",
        "Replace ECB mode with GCM or CBC to prevent block-level pattern leakage",
        "Password 'password123' detected — must be replaced with a randomly generated key",
        "Implement PBKDF2 or Argon2 for key derivation",
      ],
    },
    patterns: {
      repeatedCharacters: true,
      repeatedSequences: ["4e6f7720697320746865", "48656c6c6f20576f726c"],
      blockRepetition: true,
      observations:
        "ECB mode encryption has produced visually identical ciphertext blocks for repeated plaintext blocks. This exposes plaintext structure through the ciphertext, a classic ECB mode vulnerability.",
    },
    securityScore: {
      overall: 34,
      riskClassification: "Critical",
      breakdown: {
        rsaScore: 12,
        aesScore: 28,
        entropyScore: 76,
        patternScore: 20,
      },
    },
    recommendations: [
      {
        priority: "Critical",
        action: "Increase RSA key size to minimum 2048 bits, preferably 4096 bits",
      },
      {
        priority: "Critical",
        action: "Replace public exponent e=3 with e=65537 (0x10001)",
      },
      { priority: "High", action: "Switch from AES-128-ECB to AES-256-GCM" },
      {
        priority: "High",
        action:
          "Generate a cryptographically secure random password of at least 32 characters",
      },
      {
        priority: "Medium",
        action:
          "Implement HMAC-SHA256 for message authentication alongside encryption",
      },
      {
        priority: "Low",
        action:
          "Consider hybrid encryption for large files to optimize performance",
      },
    ],
  },
  recentAnalyses: [
    {
      id: "a001",
      fileName: "contract_signed.pdf",
      date: "2024-06-14",
      score: 78,
      status: "Moderate",
    },
    {
      id: "a002",
      fileName: "user_database_export.csv",
      date: "2024-06-13",
      score: 91,
      status: "Secure",
    },
    {
      id: "a003",
      fileName: "rsa_key_2048.json",
      date: "2024-06-12",
      score: 34,
      status: "Critical",
    },
    {
      id: "a004",
      fileName: "session_tokens.txt",
      date: "2024-06-11",
      score: 55,
      status: "Weak",
    },
    {
      id: "a005",
      fileName: "encrypted_backup.docx",
      date: "2024-06-10",
      score: 88,
      status: "Secure",
    },
  ],
};

export default analysisResults;
