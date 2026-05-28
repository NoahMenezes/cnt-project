export interface SecurityTrendPoint {
  date: string;
  avgScore: number;
}

export interface RSAvsAESPoint {
  category: string;
  rsa: number;
  aes: number;
}

export interface WeaknessItem {
  name: string;
  value: number;
  count: number;
}

export interface EntropyBucket {
  range: string;
  count: number;
  classification: string;
}

export interface CharFreqItem {
  char: string;
  frequency: number;
}

export interface EncryptionTimePoint {
  fileSizeKB: number;
  timeMs: number;
  fileName: string;
}

export interface ActivityPoint {
  date: string;
  analyses: number;
}

export interface ChartStatistics {
  totalAnalyses: number;
  averageScore: number;
  weakFindings: number;
  filesProcessed: number;
  mostCommonIssue: string;
}

export interface ChartData {
  securityTrends: SecurityTrendPoint[];
  rsaVsAES: RSAvsAESPoint[];
  weaknessDistribution: WeaknessItem[];
  entropyDistribution: EntropyBucket[];
  characterFrequency: CharFreqItem[];
  encryptionTimeVsFileSize: EncryptionTimePoint[];
  activityTrends: ActivityPoint[];
  statistics: ChartStatistics;
}

const chartData: ChartData = {
  securityTrends: [
    { date: "Jun 8", avgScore: 62 },
    { date: "Jun 9", avgScore: 71 },
    { date: "Jun 10", avgScore: 58 },
    { date: "Jun 11", avgScore: 74 },
    { date: "Jun 12", avgScore: 80 },
    { date: "Jun 13", avgScore: 69 },
    { date: "Jun 14", avgScore: 77 },
  ],
  rsaVsAES: [
    { category: "Critical", rsa: 8, aes: 3 },
    { category: "Weak", rsa: 5, aes: 7 },
    { category: "Moderate", rsa: 12, aes: 9 },
    { category: "Secure", rsa: 19, aes: 25 },
  ],
  weaknessDistribution: [
    { name: "Small RSA Key", value: 28, count: 14 },
    { name: "Weak Exponent", value: 18, count: 9 },
    { name: "ECB Mode", value: 22, count: 11 },
    { name: "Weak Password", value: 32, count: 16 },
  ],
  entropyDistribution: [
    { range: "0–2", count: 3, classification: "Very Low" },
    { range: "2–4", count: 7, classification: "Low" },
    { range: "4–6", count: 14, classification: "Medium" },
    { range: "6–7.5", count: 21, classification: "High" },
    { range: "7.5–8", count: 18, classification: "Very High" },
  ],
  characterFrequency: [
    { char: "E", frequency: 182 },
    { char: "A", frequency: 165 },
    { char: "F", frequency: 148 },
    { char: "0", frequency: 134 },
    { char: "B", frequency: 129 },
    { char: "C", frequency: 121 },
    { char: "D", frequency: 118 },
    { char: "1", frequency: 112 },
    { char: "9", frequency: 104 },
    { char: "3", frequency: 97 },
  ],
  encryptionTimeVsFileSize: [
    { fileSizeKB: 10, timeMs: 42, fileName: "note.txt" },
    { fileSizeKB: 50, timeMs: 118, fileName: "doc.pdf" },
    { fileSizeKB: 100, timeMs: 210, fileName: "report.docx" },
    { fileSizeKB: 250, timeMs: 480, fileName: "database.csv" },
    { fileSizeKB: 500, timeMs: 892, fileName: "backup.json" },
    { fileSizeKB: 1000, timeMs: 1740, fileName: "archive.zip" },
  ],
  activityTrends: [
    { date: "Jun 8", analyses: 7 },
    { date: "Jun 9", analyses: 12 },
    { date: "Jun 10", analyses: 5 },
    { date: "Jun 11", analyses: 9 },
    { date: "Jun 12", analyses: 15 },
    { date: "Jun 13", analyses: 11 },
    { date: "Jun 14", analyses: 4 },
  ],
  statistics: {
    totalAnalyses: 63,
    averageScore: 71.4,
    weakFindings: 28,
    filesProcessed: 63,
    mostCommonIssue: "Weak RSA Key Size",
  },
};

export default chartData;
