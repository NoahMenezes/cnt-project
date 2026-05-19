"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, SplitText, TextPlugin);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroBadgeRef = useRef<HTMLDivElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);
  const heroTaglineRef = useRef<HTMLDivElement>(null);
  const scrollLineRef = useRef<HTMLDivElement>(null);
  const feat1Ref = useRef<HTMLDivElement>(null);
  const feat2Ref = useRef<HTMLDivElement>(null);
  const feat3Ref = useRef<HTMLDivElement>(null);
  const feat4Ref = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ── NAV ── */
      gsap.from(navRef.current, {
        y: -60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      /* ── BADGE ── */
      gsap.from(heroBadgeRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: "power3.out",
      });

      /* ── HERO HEADLINE word-by-word ── */
      const split = new SplitText(heroTitleRef.current, { type: "words,chars" });
      gsap.from(split.words, {
        y: 120,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        stagger: 0.07,
        ease: "power4.out",
      });

      /* ── HERO SUB ── */
      gsap.from(heroSubRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 1.1,
        ease: "power3.out",
      });

      /* ── TAGLINE MARQUEE FADE ── */
      gsap.from(heroTaglineRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 1.3,
        ease: "power3.out",
      });

      /* ── CTA BUTTONS ── */
      gsap.from(heroCTARef.current?.children ?? [], {
        y: 40,
        opacity: 0,
        duration: 0.9,
        delay: 1.4,
        stagger: 0.12,
        ease: "power3.out",
      });

      /* ── SCROLL INDICATOR ── */
      gsap.from(scrollLineRef.current, {
        opacity: 0,
        scaleY: 0,
        transformOrigin: "top",
        duration: 1.2,
        delay: 2,
        ease: "power2.out",
      });
      gsap.to(scrollLineRef.current, {
        y: 20,
        repeat: -1,
        yoyo: true,
        duration: 1.4,
        ease: "sine.inOut",
        delay: 2.2,
      });

      /* ── MARQUEE STRIP ── */
      const marqueeEl = marqueeRef.current;
      if (marqueeEl) {
        const track = marqueeEl.querySelector<HTMLDivElement>(".marquee-track");
        if (track) {
          gsap.to(track, {
            xPercent: -50,
            repeat: -1,
            duration: 22,
            ease: "none",
          });
        }
      }

      /* ── FEATURE CARDS ── */
      [feat1Ref, feat2Ref, feat3Ref, feat4Ref].forEach((ref, i) => {
        if (!ref.current) return;
        gsap.from(ref.current, {
          scrollTrigger: {
            trigger: ref.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          y: 60,
          opacity: 0,
          duration: 0.9,
          delay: i * 0.1,
          ease: "power3.out",
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      ref: feat1Ref,
      icon: "🔐",
      title: "RSA Key Exchange",
      desc: "2048-bit RSA key pairs are auto-generated per user. Public keys are shared through the server — your private key never leaves your device.",
      tag: "Asymmetric Crypto",
    },
    {
      ref: feat2Ref,
      icon: "⚡",
      title: "AES-256-GCM Messages",
      desc: "Each conversation gets a unique AES-256-GCM session key, encrypted client-side. Blazing-fast and quantum-resistant symmetric encryption.",
      tag: "Symmetric Crypto",
    },
    {
      ref: feat3Ref,
      icon: "💬",
      title: "Real-Time Chat",
      desc: "WebSocket-powered instant messaging with typing indicators, read receipts, and message status — all fully encrypted end-to-end.",
      tag: "Socket.IO",
    },
    {
      ref: feat4Ref,
      icon: "🛡️",
      title: "HMAC Integrity",
      desc: "Every message is signed with HMAC-SHA256. Any tampering is detected and rejected before the message ever reaches your screen.",
      tag: "Message Auth",
    },
  ];

  return (
    <div ref={containerRef} style={{ background: "#fff", minHeight: "100vh", color: "#0a0a0a" }}>

      {/* ──────────── NAV ──────────── */}
      <nav
        ref={navRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: "64px",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#0a0a0a" />
            <path d="M8 14 L14 8 L20 14 L14 20 Z" fill="white" />
            <circle cx="14" cy="14" r="3" fill="#0a0a0a" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.02em" }}>
            CipherChat
          </span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: "36px", alignItems: "center" }}>
          {["Features", "Security", "Docs", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#555",
                textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0a0a0a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Nav CTA */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="#"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#555",
              textDecoration: "none",
              padding: "8px 16px",
            }}
          >
            Sign in
          </a>
          <button
            style={{
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "9px 22px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#333";
              e.currentTarget.style.transform = "scale(1.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0a0a0a";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ──────────── HERO ──────────── */}
      <section
        ref={heroRef}
        style={{
          paddingTop: "140px",
          paddingBottom: "80px",
          paddingLeft: "clamp(24px, 6vw, 120px)",
          paddingRight: "clamp(24px, 6vw, 120px)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Badge */}
        <div
          ref={heroBadgeRef}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#f3f3f3",
            border: "1px solid #e0e0e0",
            borderRadius: "999px",
            padding: "6px 14px 6px 8px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#444",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "36px",
            width: "fit-content",
          }}
        >
          <span
            style={{
              background: "#0a0a0a",
              color: "#fff",
              borderRadius: "999px",
              padding: "2px 10px",
              fontSize: "11px",
            }}
          >
            NEW
          </span>
          Hybrid RSA + AES Encryption
        </div>

        {/* Main Headline */}
        <div style={{ overflow: "hidden" }}>
          <h1
            ref={heroTitleRef}
            style={{
              fontSize: "clamp(52px, 8.5vw, 128px)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#0a0a0a",
              maxWidth: "16ch",
              marginBottom: "36px",
            }}
          >
            Messaging.{" "}
            <span style={{ color: "#888" }}>Encrypted</span>{" "}
            End-to-End.
          </h1>
        </div>

        {/* Sub */}
        <p
          ref={heroSubRef}
          style={{
            fontSize: "clamp(16px, 1.8vw, 21px)",
            color: "#666",
            maxWidth: "52ch",
            lineHeight: 1.65,
            fontWeight: 400,
            marginBottom: "20px",
            letterSpacing: "-0.01em",
          }}
        >
          CipherChat encrypts every message with AES-256-GCM before it leaves your device.
          RSA key exchange ensures only the intended recipient can read it — not even the server can.
        </p>

        {/* Tags */}
        <div
          ref={heroTaglineRef}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "52px",
            marginTop: "8px",
          }}
        >
          {["Real-time Chat", "RSA Key Exchange", "AES Encryption", "HMAC Integrity", "User Auth"].map((t) => (
            <span
              key={t}
              style={{
                border: "1px solid #ddd",
                borderRadius: "999px",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 500,
                color: "#666",
                letterSpacing: "0.01em",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div ref={heroCTARef} style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            style={{
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "16px 36px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#222";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0a0a0a";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Start Chatting
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7 2l5 5-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            style={{
              background: "transparent",
              color: "#0a0a0a",
              border: "1.5px solid #d0d0d0",
              borderRadius: "999px",
              padding: "15px 32px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "border-color 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#0a0a0a";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#d0d0d0";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            View Demo
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#aaa", fontSize: "13px", marginLeft: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#aaa" strokeWidth="1.4"/>
              <path d="M5 7l2 2 3-3" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            No credit card required
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollLineRef}
          style={{
            position: "absolute",
            bottom: "48px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            color: "#bbb",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: "1px",
              height: "48px",
              background: "linear-gradient(to bottom, #bbb, transparent)",
            }}
          />
          Scroll
        </div>
      </section>

      {/* ──────────── MARQUEE ──────────── */}
      <div
        ref={marqueeRef}
        style={{
          borderTop: "1px solid #ebebeb",
          borderBottom: "1px solid #ebebeb",
          padding: "18px 0",
          overflow: "hidden",
          background: "#fafafa",
        }}
      >
        <div
          className="marquee-track"
          style={{
            display: "flex",
            gap: "0",
            whiteSpace: "nowrap",
            width: "200%",
          }}
        >
          {[...Array(2)].map((_, di) => (
            <div
              key={di}
              style={{
                display: "flex",
                gap: "0",
                flex: "0 0 50%",
              }}
            >
              {[
                "RSA-2048 Key Pair",
                "AES-256-GCM",
                "HMAC-SHA256",
                "Socket.IO",
                "End-to-End Encrypted",
                "Perfect Forward Secrecy",
                "Zero Knowledge Server",
                "Client-Side Crypto",
                "Real-Time Messaging",
                "PBKDF2 Key Derivation",
              ].map((item, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#888",
                    letterSpacing: "0.02em",
                    padding: "0 32px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {item}
                  <span style={{ color: "#ccc", fontSize: "16px" }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ──────────── FEATURES ──────────── */}
      <section
        id="features"
        style={{
          padding: "120px clamp(24px, 6vw, 120px)",
          background: "#fff",
        }}
      >
        {/* Section label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div style={{ width: "32px", height: "1px", background: "#0a0a0a" }} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#0a0a0a",
            }}
          >
            Core Features
          </span>
        </div>

        <h2
          style={{
            fontSize: "clamp(36px, 5vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-0.035em",
            color: "#0a0a0a",
            maxWidth: "18ch",
            marginBottom: "80px",
          }}
        >
          Security built into{" "}
          <span style={{ color: "#bbb" }}>every layer.</span>
        </h2>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2px",
            background: "#ebebeb",
            border: "1px solid #ebebeb",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          {features.map(({ ref, icon, title, desc, tag }) => (
            <div
              key={title}
              ref={ref}
              style={{
                background: "#fff",
                padding: "44px 40px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                cursor: "default",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: "#f3f3f3",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                {icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#aaa",
                    marginBottom: "10px",
                  }}
                >
                  {tag}
                </p>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    marginBottom: "12px",
                    color: "#0a0a0a",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#666",
                    lineHeight: 1.7,
                    fontWeight: 400,
                  }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────── CTA BAND ──────────── */}
      <section
        style={{
          margin: "0 clamp(24px, 6vw, 120px) 120px",
          background: "#0a0a0a",
          borderRadius: "24px",
          padding: "80px clamp(32px, 5vw, 100px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />

        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#555",
          }}
        >
          Get Started Today
        </p>
        <h2
          style={{
            fontSize: "clamp(32px, 4.5vw, 64px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            color: "#fff",
            maxWidth: "20ch",
          }}
        >
          Your conversations deserve real privacy.
        </h2>
        <p style={{ fontSize: "17px", color: "#888", maxWidth: "44ch", lineHeight: 1.65 }}>
          Join CipherChat and experience messaging where zero compromise on security means zero compromise on speed.
        </p>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <button
            style={{
              background: "#fff",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "999px",
              padding: "15px 34px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Create Free Account
          </button>
          <button
            style={{
              background: "transparent",
              color: "#fff",
              border: "1.5px solid #333",
              borderRadius: "999px",
              padding: "14px 28px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#555")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
          >
            Learn more
          </button>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer
        style={{
          borderTop: "1px solid #ebebeb",
          padding: "40px clamp(24px, 6vw, 120px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#0a0a0a" />
            <path d="M8 14 L14 8 L20 14 L14 20 Z" fill="white" />
            <circle cx="14" cy="14" r="3" fill="#0a0a0a" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em" }}>
            CipherChat
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "#aaa" }}>
          © 2025 CipherChat. End-to-end encrypted, always.
        </p>
        <div style={{ display: "flex", gap: "28px" }}>
          {["Privacy", "Terms", "Security"].map((item) => (
            <a
              key={item}
              href="#"
              style={{ fontSize: "13px", color: "#aaa", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0a0a0a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
            >
              {item}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
