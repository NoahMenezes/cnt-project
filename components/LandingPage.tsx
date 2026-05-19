"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ChevronRight, Shield, Lock, Key, Zap, MessageSquare, Globe } from "lucide-react";

export function LandingPage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });

  return (
    <div className="relative min-h-screen bg-[#0c0c0c] text-white overflow-hidden font-sans">
      {/* Background Video or Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c] via-[#0c0c0c]/80 to-[#0c0c0c]" />
        <video autoPlay loop muted playsInline
          className="w-full h-full object-cover pointer-events-none mix-blend-screen"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="pt-32 md:pt-48 pb-20 text-center flex flex-col items-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 mb-8 backdrop-blur-md"
          >
            <Shield className="w-4 h-4 text-[#00d2ff]" />
            <span>End-to-End Encrypted</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-8xl lg:text-[140px] font-bold tracking-tighter leading-none mb-6"
          >
            <span 
              className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50"
            >
              CipherChat
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="max-w-2xl text-lg md:text-xl text-white/60 mb-10 leading-relaxed"
          >
            Normal messaging systems expose your data. CipherChat uses hybrid RSA + AES encryption so your messages are strictly yours.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <button className="bg-white text-black px-8 py-4 rounded-full font-medium flex items-center gap-2 hover:bg-white/90 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">
              Start Chatting Securely <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </section>

        {/* Timeline Animation Section */}
        <section className="py-32 px-6 relative" ref={timelineRef}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">How it works</h2>
              <p className="text-white/60 text-lg">The anatomy of a zero-knowledge message.</p>
            </div>
            
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-white/10" />
              
              <motion.div 
                className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#00d2ff] via-[#6c47ff] to-[#00d2ff] origin-top"
                style={{ scaleY: scrollYProgress }}
              />

              {/* Timeline Items */}
              {[
                { icon: MessageSquare, title: "Message Composed", desc: "You type a message. It stays strictly on your local device." },
                { icon: Key, title: "AES Encryption", desc: "The message is encrypted with a unique, one-time AES session key." },
                { icon: Lock, title: "RSA Key Exchange", desc: "The AES key is encrypted using the recipient's public RSA key." },
                { icon: Globe, title: "Secure Transmission", desc: "Only the encrypted payload travels through our servers. We see nothing." },
                { icon: Zap, title: "Decryption & Read", desc: "The recipient's private RSA key decrypts the AES key, revealing the message." },
              ].map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`relative flex items-center mb-16 md:mb-24 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className="hidden md:block md:w-1/2" />
                  
                  <div className="absolute left-0 md:left-1/2 w-14 h-14 bg-[#0c0c0c] border-2 border-white/20 rounded-full flex items-center justify-center -translate-x-0 md:-translate-x-1/2 z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="pl-20 md:pl-0 md:w-1/2 md:px-12 w-full">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <h3 className="text-xl font-semibold mb-3 tracking-tight">{step.title}</h3>
                      <p className="text-white/60 leading-relaxed text-sm md:text-base">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features in Cards */}
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl z-0" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="mb-20 md:text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Uncompromising Security</h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg">Everything you need for private communication, built in.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Real-time Chat", desc: "Instant message delivery via WebSockets without sacrificing encryption speed.", icon: Zap },
                { title: "RSA Key Pair", desc: "Automatic 2048-bit RSA key generation stored locally on your device.", icon: Key },
                { title: "Zero-Knowledge", desc: "We cannot read your messages even if we wanted to. Your keys, your data.", icon: Shield },
                { title: "AES-256 GCM", desc: "Military-grade symmetric encryption for ultra-fast message payloads.", icon: Lock },
                { title: "Secure History", desc: "Chat history is stored locally and securely, never exposed in plain text.", icon: MessageSquare },
                { title: "Global Access", desc: "Access your secure chats anywhere while maintaining absolute privacy.", icon: Globe },
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-3xl p-8 hover:bg-white/[0.06] transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#6c47ff]/20 group-hover:text-[#6c47ff] transition-colors">
                    <feature.icon className="w-6 h-6 text-white/80 group-hover:text-[#6c47ff] transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Latest Insights</h2>
                <p className="text-white/60 max-w-xl text-lg">Deep dives into encryption, privacy, and the engineering behind CipherChat.</p>
              </div>
              <button className="text-sm font-medium border border-white/20 px-6 py-3 rounded-full hover:bg-white/10 transition-colors shrink-0 flex items-center gap-2">
                View all articles <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { date: "May 19, 2026", category: "Engineering", title: "Implementing Hybrid Encryption in Next.js", color: "from-[#00d2ff] to-[#091020]" },
                { date: "May 12, 2026", category: "Privacy", title: "Why End-to-End Encryption is a Human Right", color: "from-[#6c47ff] to-[#091020]" },
                { date: "April 28, 2026", category: "Architecture", title: "Zero-Knowledge Architectures for Web Apps", color: "from-[#00ffaa] to-[#102030]" },
              ].map((post, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group cursor-pointer flex flex-col h-full"
                >
                  <div className="aspect-[16/10] rounded-3xl overflow-hidden mb-6 relative bg-white/5 border border-white/10">
                    <div className={`absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br ${post.color}`} />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-white/50 mb-4">
                    <span className="text-white bg-white/10 px-3 py-1 rounded-full">{post.category}</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-2xl font-semibold group-hover:text-white/80 transition-colors tracking-tight leading-snug">{post.title}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-32 px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-[40px] p-10 md:p-24 text-center relative overflow-hidden backdrop-blur-md"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#6c47ff] opacity-20 blur-[120px] rounded-full pointer-events-none" />
            
            <h2 className="relative z-10 text-4xl md:text-6xl font-bold mb-6 tracking-tight">Take back your privacy.</h2>
            <p className="relative z-10 text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join the new standard of secure communication. Built with open standards, designed for the modern web.
            </p>
            
            <button className="relative z-10 bg-white text-black px-10 py-5 rounded-full font-semibold hover:bg-white/90 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.2)] text-lg">
              Create Free Account
            </button>
          </motion.div>
        </section>
        
        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-6 mt-auto bg-black/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-white/60" />
              <span className="font-medium text-white/60 text-base">CipherChat</span>
            </div>
            <p>© 2026 CipherChat. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
