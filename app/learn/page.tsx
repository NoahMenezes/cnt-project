"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  HelpCircle, 
  Calculator, 
  ShieldAlert, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Award
} from "lucide-react";

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================
const NAV = [
  { title: "Home", href: "/" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Analyze", href: "/analyze" },
  { title: "Hybrid Lab", href: "/hybrid-lab" },
  { title: "Visualizations", href: "/visualizations" },
  { title: "Reports", href: "/reports" },
  { title: "Learn", href: "/learn", isActive: true },
  { title: "Profile", href: "/profile" },
];

// ============================================================================
// QUIZ DATA
// ============================================================================
const QUIZZES = [
  {
    id: 1,
    question: "Why is AES used instead of RSA to encrypt the actual message in a hybrid encryption system?",
    options: [
      "RSA is insecure for encrypting text.",
      "AES is symmetric and much faster than asymmetric RSA for bulk data.",
      "RSA key pairs can only be generated once.",
      "AES supports larger key sizes than RSA."
    ],
    answerIndex: 1,
    explanation: "Asymmetric cryptography (RSA) involves complex modular exponentiation and is computationally expensive. Symmetric cryptography (AES) is extremely fast and suited for encrypting large amounts of data. Hybrid systems combine both: RSA encrypts the small AES key, and AES encrypts the bulk data."
  },
  {
    id: 2,
    question: "What does an entropy value close to 8.0 bits per character imply about a ciphertext?",
    options: [
      "The message is easily crackable due to high predictability.",
      "The encryption key was weak.",
      "The ciphertext appears highly random, indicating strong encryption without structural patterns.",
      "The plaintext modulus was factored successfully."
    ],
    answerIndex: 2,
    explanation: "Shannon entropy measures randomness. For byte-aligned data, 8.0 is the maximum possible entropy (perfect randomness). A high entropy score (e.g., >7.5) indicates that the data contains no visible frequency patterns, which is a hallmark of strong encryption."
  },
  {
    id: 3,
    question: "In RSA, what is the role of Euler's Totient Function φ(n)?",
    options: [
      "It generates the AES session key randomly.",
      "It calculates the length of the symmetric ciphertext.",
      "It represents the number of positive integers up to n that are coprime to n, crucial for finding the decryption key d.",
      "It is used as the public exponent e directly."
    ],
    answerIndex: 2,
    explanation: "Euler's Totient Function φ(n) = (p-1)(q-1) is used to find the private decryption key d such that (d * e) ≡ 1 (mod φ(n)), where e is the public exponent."
  }
];

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<"concepts" | "calculators" | "quizzes">("concepts");
  const [activeConcept, setActiveConcept] = useState<string>("hybrid");

  // Calculator States
  const [gcdA, setGcdA] = useState("61");
  const [gcdB, setGcdB] = useState("53");
  const [calcSteps, setCalcSteps] = useState<string[]>([]);
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const [entropyText, setEntropyText] = useState("Hello World! This is an entropy test.");
  const [entropyVal, setEntropyVal] = useState<number | null>(null);

  // Quiz States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuizzes, setSubmittedQuizzes] = useState<Record<number, boolean>>({});

  // GCD Calculator Logic
  const runGCD = () => {
    const a = parseInt(gcdA);
    const b = parseInt(gcdB);
    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) {
      setCalcResult("Please enter positive integers.");
      setCalcSteps([]);
      return;
    }

    const steps: string[] = [];
    let tempA = a;
    let tempB = b;
    
    while (tempB !== 0) {
      const quotient = Math.floor(tempA / tempB);
      const remainder = tempA % tempB;
      steps.push(`${tempA} = (${quotient} * ${tempB}) + ${remainder}`);
      tempA = tempB;
      tempB = remainder;
    }
    
    setCalcSteps(steps);
    setCalcResult(`GCD(${a}, ${b}) = ${tempA}`);
  };

  // Shannon Entropy Logic
  const runEntropy = () => {
    if (!entropyText) {
      setEntropyVal(0);
      return;
    }
    const len = entropyText.length;
    const freqs: Record<string, number> = {};
    for (let i = 0; i < len; i++) {
      const char = entropyText[i];
      freqs[char] = (freqs[char] || 0) + 1;
    }
    let h = 0;
    Object.values(freqs).forEach((f) => {
      const p = f / len;
      h -= p * Math.log2(p);
    });
    setEntropyVal(parseFloat(h.toFixed(4)));
  };

  const handleSelectAnswer = (quizId: number, optionIdx: number) => {
    if (submittedQuizzes[quizId]) return;
    setSelectedAnswers({ ...selectedAnswers, [quizId]: optionIdx });
  };

  const handleSubmitQuiz = (quizId: number) => {
    if (selectedAnswers[quizId] === undefined) return;
    setSubmittedQuizzes({ ...submittedQuizzes, [quizId]: true });
  };

  const handleResetQuiz = (quizId: number) => {
    const newAnswers = { ...selectedAnswers };
    delete newAnswers[quizId];
    setSelectedAnswers(newAnswers);

    const newSubmitted = { ...submittedQuizzes };
    delete newSubmitted[quizId];
    setSubmittedQuizzes(newSubmitted);
  };

  return (
    <div className="relative min-h-screen bg-black text-foreground">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute left-1/4 top-1/4 h-[350px] w-[350px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[350px] w-[350px] rounded-full bg-sky-500/5 blur-[100px]" />
      </div>

      <Header navigationData={NAV} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Banner Section */}
        <div className="mb-10 text-center md:text-left">
          <Badge variant="outline" className="mb-3 uppercase tracking-wider text-xs border-primary/40 bg-primary/10 text-primary">
            <BookOpen className="w-3.5 h-3.5 mr-1 inline-block" />
            Cryptography Classroom
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
            Understand RSA, AES, & Entropy
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base">
            Explore the mathematics and logic governing modern hybrid encryption standards. Learn modular arithmetic, compute file Shannon entropy, and test your knowledge.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border/40 gap-6 mb-8 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("concepts")}
            className={`pb-3 text-sm font-semibold uppercase tracking-wider relative transition-colors ${
              activeTab === "concepts" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Core Concepts
          </button>
          <button
            onClick={() => setActiveTab("calculators")}
            className={`pb-3 text-sm font-semibold uppercase tracking-wider relative transition-colors ${
              activeTab === "calculators" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Interactive Calculators
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`pb-3 text-sm font-semibold uppercase tracking-wider relative transition-colors ${
              activeTab === "quizzes" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Quizzes & Assessment
          </button>
        </div>

        {/* ====================================================================
            TAB: CONCEPTS
            ==================================================================== */}
        {activeTab === "concepts" && (
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar selection */}
            <div className="flex flex-col gap-2">
              {[
                { id: "hybrid", label: "Hybrid Cryptography" },
                { id: "rsa", label: "RSA & Prime Numbers" },
                { id: "aes", label: "Symmetric AES" },
                { id: "math", label: "Modular Arithmetic" },
                { id: "entropy", label: "Entropy & Randomness" },
                { id: "practices", label: "Cryptographic Best Practices" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveConcept(item.id)}
                  className={`flex items-center justify-between text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    activeConcept === item.id 
                      ? "border-primary/50 bg-primary/10 text-primary shadow-lg shadow-primary/5" 
                      : "border-border/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Concept Content */}
            <div className="md:col-span-3">
              <Card className="p-6 md:p-8 border-border/40 bg-background/50 backdrop-blur-md">
                {activeConcept === "hybrid" && (
                  <div className="space-y-6">
                    <div>
                      <Badge className="bg-primary/20 text-primary mb-2 border border-primary/30 uppercase tracking-widest text-[10px]">Architecture</Badge>
                      <h2 className="text-2xl font-bold text-white mb-2">Hybrid RSA–AES Encryption</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Hybrid encryption combines the speed of symmetric-key cryptography with the security of public-key cryptography. In a typical transmission, we encrypt bulk data with a fast symmetric algorithm (AES) using a session key, and then encrypt that session key with the recipient's asymmetric public key (RSA).
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-muted/40 border border-border/30">
                        <h4 className="text-white font-semibold text-sm mb-1">1. Symmetric Step (AES)</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          A strong, random 256-bit AES session key is generated. The message is encrypted using AES, producing ciphertext instantly.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/40 border border-border/30">
                        <h4 className="text-white font-semibold text-sm mb-1">2. Asymmetric Step (RSA)</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          The AES session key is encrypted (wrapped) using the recipient's public RSA key. The wrapped key is transmitted along with the ciphertext.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-border/60 bg-black/40">
                      <h4 className="text-primary font-semibold text-xs uppercase tracking-wider mb-2">Why we do this</h4>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        RSA is mathematically intensive, based on the multiplication of giant prime numbers. Encrypting a 10MB file directly with RSA would take seconds or minutes and consume massive CPU power. AES is hardware-accelerated on modern processors and encrypts gigabytes instantly. Using RSA to encrypt only the 32-byte AES key solves the key distribution problem without compromising speed.
                      </p>
                    </div>
                  </div>
                )}

                {activeConcept === "rsa" && (
                  <div className="space-y-6">
                    <div>
                      <Badge className="bg-primary/20 text-primary mb-2 border border-primary/30 uppercase tracking-widest text-[10px]">Asymmetric</Badge>
                      <h2 className="text-2xl font-bold text-white mb-2">RSA Key Generation & Prime Factors</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        RSA relies on the practical difficulty of factoring the product of two large prime numbers. While multiplying two primes (p * q = n) is trivial, finding p and q given only n is computationally infeasible for sufficiently large primes.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-white font-semibold text-base">Key Formula Steps</h3>
                      <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                        <li>Choose two prime numbers p and q.</li>
                        <li>Compute modulus n = p * q. The bit-length of n represents the key size.</li>
                        <li>Compute Euler's Totient function φ(n) = (p - 1) * (q - 1).</li>
                        <li>Choose an integer e (public exponent) such that 1 &lt; e &lt; φ(n) and gcd(e, φ(n)) = 1. Standard is 65537.</li>
                        <li>Compute private key d such that (d * e) ≡ 1 (mod φ(n)) (modular multiplicative inverse).</li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400">
                      <div className="flex gap-2.5 items-start">
                        <ShieldAlert className="w-4 h-4 mt-0.5 flex-none" />
                        <div>
                          <h4 className="font-semibold text-xs uppercase tracking-wider mb-1">Factorization Vulnerability</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            If RSA keys are smaller than 2048 bits (e.g. 512-bit or 1024-bit), modern factoring algorithms like the General Number Field Sieve (GNFS) can retrieve p and q on modest compute servers, compromising the private exponent d and decrypting all traffic.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeConcept === "aes" && (
                  <div className="space-y-6">
                    <div>
                      <Badge className="bg-primary/20 text-primary mb-2 border border-primary/30 uppercase tracking-widest text-[10px]">Symmetric</Badge>
                      <h2 className="text-2xl font-bold text-white mb-2">AES (Advanced Encryption Standard)</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        AES is a symmetric block cipher chosen by the US government to protect classified information. It operates on fixed-size blocks of 128 bits, using key sizes of 128, 192, or 256 bits.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-white font-semibold text-base">Encryption Modes</h3>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl border border-border/40 bg-black/40">
                          <h4 className="text-red-400 font-semibold text-xs uppercase tracking-wider mb-1">ECB Mode (Weak)</h4>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            Electronic Codebook encrypts each block independently. Identical plaintext blocks yield identical ciphertext blocks, leaking structural patterns.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-border/40 bg-black/40">
                          <h4 className="text-yellow-400 font-semibold text-xs uppercase tracking-wider mb-1">CBC Mode</h4>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            Cipher Block Chaining XORs each plaintext block with the previous ciphertext block before encryption. Requires an Initialization Vector (IV).
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-border/40 bg-black/40">
                          <h4 className="text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">GCM Mode (Secure)</h4>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            Galois/Counter Mode provides authenticated encryption. It ensures both confidentiality and integrity of the data using an authentication tag.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeConcept === "math" && (
                  <div className="space-y-6">
                    <div>
                      <Badge className="bg-primary/20 text-primary mb-2 border border-primary/30 uppercase tracking-widest text-[10px]">Mathematics</Badge>
                      <h2 className="text-2xl font-bold text-white mb-2">Modular Arithmetic & Euler's Totient</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Modular arithmetic is arithmetic for integers where numbers "wrap around" upon reaching a certain value (the modulus). It is the backbone of asymmetric cryptosystems.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Euler's Totient Function φ(n)</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          For a prime p, φ(p) = p - 1. Since primes have no divisors besides 1 and themselves, all numbers less than p are coprime to it. For n = p * q, φ(n) = (p-1)*(q-1).
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Modular Inverse</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          The modular multiplicative inverse of a modulo m is an integer x such that (a * x) ≡ 1 (mod m). This is solved using the Extended Euclidean Algorithm, critical for finding the decryption key d.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeConcept === "entropy" && (
                  <div className="space-y-6">
                    <div>
                      <Badge className="bg-primary/20 text-primary mb-2 border border-primary/30 uppercase tracking-widest text-[10px]">Information Theory</Badge>
                      <h2 className="text-2xl font-bold text-white mb-2">Entropy & Randomness</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Shannon entropy measures the average rate at which information is produced by a stochastic source. In cybersecurity, we use it to measure the randomness of files. If a file is encrypted properly, it should exhibit near-perfect randomness (high entropy).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/40 border border-border/30 space-y-2">
                      <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Formula for Shannon Entropy</h4>
                      <p className="font-mono text-xs text-primary bg-black/60 p-2.5 rounded-lg border border-border/30 inline-block">
                        H(X) = - Σ ( p(xi) * log2(p(xi)) )
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Where p(x_i) is the probability (frequency fraction) of occurrence of the character x_i in the file.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-3 rounded-lg border border-border/40 bg-black/40">
                        <h5 className="font-semibold text-red-400 mb-1">0 - 4.5 bits</h5>
                        <p className="text-muted-foreground">Plaintext or Code</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/40 bg-black/40">
                        <h5 className="font-semibold text-yellow-400 mb-1">4.5 - 6.8 bits</h5>
                        <p className="text-muted-foreground">Compressed Data</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/40 bg-black/40">
                        <h5 className="font-semibold text-emerald-400 mb-1">6.8 - 8.0 bits</h5>
                        <p className="text-muted-foreground">Encrypted Ciphertext</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeConcept === "practices" && (
                  <div className="space-y-6">
                    <div>
                      <Badge className="bg-primary/20 text-primary mb-2 border border-primary/30 uppercase tracking-widest text-[10px]">Best Practices</Badge>
                      <h2 className="text-2xl font-bold text-white mb-2">Cryptographic Safety Checkpoints</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Implement standard recommendations to guarantee message security and avoid critical forensic flagging.
                      </p>
                    </div>

                    <ul className="space-y-3.5 text-xs text-muted-foreground">
                      <li className="flex gap-2 items-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-none" />
                        <div>
                          <strong className="text-white">Use RSA-2048 minimum</strong>: Factorization algorithms are highly efficient. RSA-1024 is deprecated, and RSA-4096 is recommended for long-term data security.
                        </div>
                      </li>
                      <li className="flex gap-2 items-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-none" />
                        <div>
                          <strong className="text-white">Choose e = 65537</strong>: Avoid small public exponents like e = 3, which are vulnerable to broadcast and low-exponent attacks.
                        </div>
                      </li>
                      <li className="flex gap-2 items-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-none" />
                        <div>
                          <strong className="text-white">Avoid AES ECB mode</strong>: Electronic Codebook mode lacks randomized block-level initialization. Plaintext patterns are leaked, as seen in the famous ECB penguin vulnerability. Always use GCM or CBC.
                        </div>
                      </li>
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB: CALCULATORS
            ==================================================================== */}
        {activeTab === "calculators" && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* GCD/Euclidean Calculator */}
            <Card className="p-6 border-border/40 bg-background/50 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex gap-2.5 items-center mb-4">
                  <Calculator className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-white">Euclidean Algorithm Steps</h3>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                  Compute the Greatest Common Divisor (GCD) of two numbers step-by-step. In RSA, coprime numbers ($\gcd(e, \phi(n)) = 1$) are necessary to generate keys.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Number A</label>
                    <input
                      type="number"
                      value={gcdA}
                      onChange={(e) => setGcdA(e.target.value)}
                      className="w-full bg-black/60 border border-border/40 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Number B</label>
                    <input
                      type="number"
                      value={gcdB}
                      onChange={(e) => setGcdB(e.target.value)}
                      className="w-full bg-black/60 border border-border/40 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {calcSteps.length > 0 && (
                  <div className="bg-black/60 p-3 rounded-lg border border-border/30 max-h-48 overflow-y-auto mb-4 space-y-1">
                    <p className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1">Division Steps</p>
                    {calcSteps.map((step, idx) => (
                      <p key={idx} className="font-mono text-xs text-muted-foreground">{step}</p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {calcResult && (
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs text-center mb-4">
                    {calcResult}
                  </div>
                )}
                <Button onClick={runGCD} className="w-full cursor-pointer">
                  Calculate GCD
                </Button>
              </div>
            </Card>

            {/* Entropy Calculator */}
            <Card className="p-6 border-border/40 bg-background/50 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex gap-2.5 items-center mb-4">
                  <Calculator className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-white">Shannon Entropy Calculator</h3>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                  Paste sample text to calculate character frequency randomness. Properly encrypted text yields entropy scores above $6.5$.
                </p>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Test Plaintext / Ciphertext</label>
                  <textarea
                    rows={4}
                    value={entropyText}
                    onChange={(e) => setEntropyText(e.target.value)}
                    className="w-full bg-black/60 border border-border/40 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                {entropyVal !== null && (
                  <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-xs text-center mb-4">
                    Shannon Entropy: {entropyVal} bits / character
                  </div>
                )}
                <Button onClick={runEntropy} className="w-full cursor-pointer">
                  Calculate Entropy
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ====================================================================
            TAB: QUIZZES
            ==================================================================== */}
        {activeTab === "quizzes" && (
          <div className="space-y-6">
            {QUIZZES.map((quiz, quizIdx) => {
              const hasSubmitted = submittedQuizzes[quiz.id];
              const selectedIdx = selectedAnswers[quiz.id];
              const isCorrect = selectedIdx === quiz.answerIndex;

              return (
                <Card key={quiz.id} className="p-6 border-border/40 bg-background/50 backdrop-blur-md">
                  <div className="flex gap-3.5 items-start mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-none">
                      {quizIdx + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm leading-relaxed mt-1">
                        {quiz.question}
                      </h4>
                    </div>
                  </div>

                  <div className="grid gap-3.5 mb-5 pl-11">
                    {quiz.options.map((option, optIdx) => {
                      const isSelected = selectedIdx === optIdx;
                      let optionStyle = "border-border/40 bg-black/40 text-muted-foreground hover:text-foreground";
                      
                      if (isSelected) {
                        optionStyle = "border-primary bg-primary/10 text-primary";
                      }
                      if (hasSubmitted) {
                        if (optIdx === quiz.answerIndex) {
                          optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                        } else if (isSelected) {
                          optionStyle = "border-red-500 bg-red-500/10 text-red-400";
                        } else {
                          optionStyle = "border-border/20 bg-black/20 text-muted-foreground/40 pointer-events-none";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={hasSubmitted}
                          onClick={() => handleSelectAnswer(quiz.id, optIdx)}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-xs font-medium transition-all ${optionStyle} ${
                            !hasSubmitted ? "cursor-pointer" : ""
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {hasSubmitted && (
                    <div className="pl-11 border-l-2 border-border/60 py-1.5 space-y-2 mb-4">
                      <div className="flex gap-2 items-center">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-xs font-bold ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                          {isCorrect ? "Correct answer!" : "Incorrect option selected."}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed max-w-2xl">
                        {quiz.explanation}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pl-11">
                    {hasSubmitted ? (
                      <Button
                        variant="outline"
                        onClick={() => handleResetQuiz(quiz.id)}
                        className="text-xs h-9 cursor-pointer flex gap-1.5 items-center"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                      </Button>
                    ) : (
                      <Button
                        disabled={selectedIdx === undefined}
                        onClick={() => handleSubmitQuiz(quiz.id)}
                        className="text-xs h-9 cursor-pointer"
                      >
                        Submit Answer
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
