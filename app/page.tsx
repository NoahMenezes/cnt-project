"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Zap,
  Server,
  KeyRound,
  FileKey,
  ArrowRight,
  Check,
  X,
  Globe,
  Wallet,
  ChevronDown,
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const steps = [
  {
    n: 1,
    title: "Get Public Key",
    desc: "Fetch recipient RSA key from Ethereum",
    icon: KeyRound,
    color: "#00d4ff",
  },
  {
    n: 2,
    title: "Generate AES Key",
    desc: "Random 256-bit session key via Web Crypto",
    icon: Zap,
    color: "#00ff88",
  },
  {
    n: 3,
    title: "Encrypt Message",
    desc: "AES-GCM encrypt → ciphertext + auth tag",
    icon: Lock,
    color: "#ffaa00",
  },
  {
    n: 4,
    title: "Wrap AES Key",
    desc: "RSA-OAEP encrypts the session key",
    icon: FileKey,
    color: "#ff6b35",
  },
  {
    n: 5,
    title: "Publish to Chain",
    desc: "Bundle stored on Ethereum as event",
    icon: Globe,
    color: "#00d4ff",
  },
  {
    n: 6,
    title: "Unwrap AES Key",
    desc: "Recipient's private key recovers AES key",
    icon: KeyRound,
    color: "#00ff88",
  },
  {
    n: 7,
    title: "Decrypt & Verify",
    desc: "AES-GCM decrypts + auth tag verified",
    icon: Shield,
    color: "#ff3366",
  },
];

const useCases = [
  {
    title: "Journalists & Sources",
    desc: "Communicate with whistleblowers without corporate metadata trails.",
  },
  {
    title: "Activists Under Surveillance",
    desc: "Organize freely  — no government can subpoena a smart contract.",
  },
  {
    title: "Whistleblowers",
    desc: "Prove message timing on-chain without revealing content.",
  },
  {
    title: "Legal Communications",
    desc: "Attorney-client privilege backed by RSA-2048 math, not promises.",
  },
  {
    title: "Business Negotiations",
    desc: "Confidential deals with verifiable encryption audit trails.",
  },
  {
    title: "Privacy Advocates",
    desc: "Your keys, your messages, your chain. Zero trust required.",
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ overflow: "hidden" }}>
      {/* ══════ HERO ══════ */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          textAlign: "center",
          padding: "2rem 1.5rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          {mounted &&
            [...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: ["0vh", "100vh"], opacity: [0.3, 0] }}
                transition={{
                  duration: 4 + Math.random() * 6,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
                className="font-mono"
                style={{
                  position: "absolute",
                  top: "-5vh",
                  left: `${Math.random() * 100}%`,
                  color: "var(--accent-primary)",
                  fontSize: "0.7rem",
                  opacity: 0.15,
                }}
              >
                {Math.random().toString(16).slice(2, 6)}
              </motion.div>
            ))}
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          style={{ position: "relative", zIndex: 1, maxWidth: 800 }}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: "1rem" }}
          >
            <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>
              <Lock size={10} /> End-to-End Encrypted on Ethereum
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="font-display glitch"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
              background:
                "linear-gradient(135deg, var(--accent-primary), #fff, var(--accent-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Messages.
            <br />
            Your Keys.
            <br />
            Your Chain.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              color: "var(--text-secondary)",
              fontSize: "1.15rem",
              lineHeight: 1.7,
              maxWidth: 600,
              margin: "0 auto 2.5rem",
            }}
          >
            Centralized messengers store your metadata, bow to subpoenas, and
            get breached. DecenChat eliminates the server entirely —{" "}
            <strong style={{ color: "var(--accent-primary)" }}>
              RSA+AES hybrid encryption
            </strong>{" "}
            runs in your browser, keys live on Ethereum. No company. No
            backdoor. Just math.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-primary pulse-glow"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 2.5rem",
                fontSize: "1rem",
                cursor: "default"
              }}
            >
              <Wallet size={18} /> Launch App
            </button>
            <a
              href="#how-it-works"
              className="btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 2rem",
              }}
            >
              How It Works <ChevronDown size={16} />
            </a>
          </motion.div>
        </motion.div>

        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "8%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </section>

      {/* ══════ PROBLEM / SOLUTION / RESULT ══════ */}
      <section className="section-spacing" style={{ padding: "5rem 1.5rem" }}>
        <div className="container-app">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                title: "The Problem",
                color: "#ff3366",
                icon: Server,
                items: [
                  "Centralized servers own your data",
                  "Metadata harvesting at scale",
                  "Legal subpoenas reveal your contacts",
                  "Corporate breaches expose millions",
                ],
              },
              {
                title: "The Solution",
                color: "#00d4ff",
                icon: Shield,
                items: [
                  "RSA+AES hybrid encryption in-browser",
                  "Public keys on Ethereum blockchain",
                  "Zero-server architecture",
                  "Open source, verifiable cryptography",
                ],
              },
              {
                title: "The Result",
                color: "#00ff88",
                icon: Lock,
                items: [
                  "Mathematically proven privacy",
                  "Verifiable on-chain audit trail",
                  "Censorship-resistant communication",
                  "No trust required — just math",
                ],
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="card glow-border"
                style={{ padding: "2rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${card.color}12`,
                      border: `1px solid ${card.color}30`,
                    }}
                  >
                    <card.icon size={20} color={card.color} />
                  </div>
                  <h3
                    className="font-display"
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: card.color,
                    }}
                  >
                    {card.title}
                  </h3>
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem",
                  }}
                >
                  {card.items.map((item, j) => (
                    <li
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          marginTop: 3,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: card.color,
                          flexShrink: 0,
                        }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS — 7 STEPS ══════ */}
      <section
        id="how-it-works"
        className="section-spacing"
        style={{ padding: "5rem 1.5rem", background: "var(--bg-secondary)" }}
      >
        <div className="container-app">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            style={{ textAlign: "center", marginBottom: "3rem" }}
          >
            <motion.h2
              variants={fadeUp}
              className="font-display"
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
              }}
            >
              How{" "}
              <span style={{ color: "var(--accent-primary)" }}>
                Hybrid Encryption
              </span>{" "}
              Works
            </motion.h2>
            <motion.p
              variants={fadeUp}
              style={{
                color: "var(--text-secondary)",
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              7 steps from plaintext to on-chain encrypted bundle — mapped
              directly to the RSA+AES academic flow.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
              position: "relative",
            }}
          >
            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="card"
                style={{
                  padding: "2rem 1.5rem",
                  textAlign: "center",
                  borderColor: `${s.color}25`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: `linear-gradient(180deg, ${s.color}05, transparent)`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    marginBottom: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${s.color}15`,
                    border: `2px solid ${s.color}50`,
                    color: s.color,
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    boxShadow: `0 0 20px ${s.color}20`,
                  }}
                >
                  {s.n}
                </div>
                <h4
                  className="font-mono"
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: s.color,
                    marginBottom: "0.75rem",
                  }}
                >
                  {s.title}
                </h4>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════ USE CASES ══════ */}
      <section
        className="section-spacing"
        style={{ padding: "5rem 1.5rem", background: "var(--bg-secondary)" }}
      >
        <div className="container-app">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display"
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: "3.5rem",
            }}
          >
            Real-World{" "}
            <span style={{ color: "var(--accent-secondary)" }}>Impact</span>
          </motion.h2>
          <div
            style={{
              position: "relative",
              maxWidth: 900,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "3rem",
            }}
          >
            {/* Animated Background Line */}
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "1rem",
                left: "1rem",
                width: "3px",
                background:
                  "linear-gradient(to bottom, var(--accent-primary, #00d4ff), var(--accent-secondary, #00ff88))",
                borderRadius: "2px",
                zIndex: 0,
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.5)",
              }}
            />

            {useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.2,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                style={{
                  position: "relative",
                  marginLeft: "4rem",
                  padding: "2rem 2.5rem",
                  background:
                    "linear-gradient(135deg, rgba(20, 20, 30, 0.8), rgba(30, 30, 50, 0.6))",
                  backdropFilter: "blur(15px)",
                  WebkitBackdropFilter: "blur(15px)",
                  borderRadius: "1.5rem",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(0, 212, 255, 0.1)",
                  zIndex: 1,
                  cursor: "pointer",
                }}
              >
                {/* Timeline Dot with Pulse */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    position: "absolute",
                    left: "-3.75rem",
                    top: "2.25rem",
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(45deg, var(--accent-primary, #00d4ff), var(--accent-secondary, #00ff88))",
                    border: "4px solid var(--bg-secondary, #0a0a0f)",
                    boxShadow:
                      "0 0 20px rgba(0, 212, 255, 0.8), 0 0 40px rgba(0, 255, 136, 0.4)",
                  }}
                />
                <h4
                  className="font-display"
                  style={{
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    marginBottom: "0.75rem",
                    color: "var(--accent-primary, #00d4ff)",
                    textShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
                  }}
                >
                  {uc.title}
                </h4>
                <p
                  style={{
                    color: "var(--text-secondary, #a1a1aa)",
                    fontSize: "1rem",
                    lineHeight: 1.7,
                  }}
                >
                  {uc.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section className="section-spacing" style={{ padding: "5rem 1.5rem" }}>
        <div className="container-app">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              textAlign: "center",
            }}
          >
            {[
              {
                label: "Encryption Algorithm",
                value: "RSA-2048 + AES-256-GCM",
              },
              { label: "Key Size", value: "2048-bit RSA / 256-bit AES" },
              { label: "Auth Tag", value: "128-bit GCM" },
              {
                label: "External Crypto Libraries",
                value: "ZERO — Web Crypto API Only",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="card"
                style={{ padding: "2rem 1rem" }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "0.5rem",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  className="font-display text-glow"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--accent-primary)",
                  }}
                >
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section
        style={{
          padding: "6rem 1.5rem",
          textAlign: "center",
          background:
            "linear-gradient(180deg, var(--bg-primary), var(--bg-secondary))",
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            className="font-display"
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "1rem",
              background:
                "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Start Encrypting Now
          </motion.h2>
          <motion.p
            variants={fadeUp}
            style={{
              color: "var(--text-secondary)",
              marginBottom: "2rem",
              maxWidth: 500,
              margin: "0 auto 2rem",
            }}
          >
            Connect your MetaMask wallet, register your RSA key on Ethereum, and
            send your first encrypted message.
          </motion.p>
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-primary pulse-glow"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 3rem",
                fontSize: "1.05rem",
                cursor: "default"
              }}
            >
              <Wallet size={20} /> Connect Wallet & Start
            </button>
            <button
              className="btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 2rem",
                cursor: "default"
              }}
            >
              Interactive Explainer <ArrowRight size={16} />
            </button>
          </motion.div>
        </motion.div>

        <div
          style={{
            marginTop: "4rem",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            textAlign: "center",
          }}
        >
          Built with 🔐 Hybrid RSA-OAEP + AES-256-GCM Encryption — Zero Trust
          Architecture
        </div>
      </section>
    </div>
  );
}
