"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Menu, Search, Sparkles, Paperclip, Reply, Forward, Archive, Trash2, MoreHorizontal } from "lucide-react";
import { AppleLogo, LogoMark, AppleButton, SectionEyebrow } from "./SharedPrimitives";

export function LandingPage() {
  const [yearly, setYearly] = useState(true);

  return (
    <div className="relative min-h-screen bg-[#0c0c0c] text-white overflow-hidden">
      {/* Global background video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay loop muted playsInline
          className="w-full h-full object-cover pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4" />
      </div>

      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* Root SVG Noise Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Section 1 — Navbar */}
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between"
        >
          <div className="flex items-center">
            <LogoMark />
          </div>
          
          <div className="hidden md:flex gap-8 items-center">
            {['Solutions','Pricing','Blog','Documentation','Careers'].map((item, i) => (
              <motion.a 
                key={item}
                href="#"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="hidden md:block">
            <AppleButton />
          </div>
          <div className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5">
            <Menu className="w-5 h-5 text-white" />
          </div>
        </motion.nav>

        {/* Section 2 — Hero */}
        <section className="pt-16 md:pt-28 pb-20 text-center flex flex-col items-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9] flex flex-col items-center"
          >
            <span className="text-white">Your email.</span>
            <span 
              className="animate-shiny mt-1 md:mt-2"
              style={{
                backgroundImage: 'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                filter: 'url(#c3-noise)'
              }}
            >
              Revitalized
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
          >
            Aura is the premier inbox platform for the current era. It leverages powerful AI to organize, prioritize, and refine your messages into total clarity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <AppleButton />
            <span className="text-xs text-white/40">Download for Intel / Apple Silicon</span>
          </motion.div>
        </section>

        {/* Section 3 — macOS menu bar strip */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="w-full h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
        >
          <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-white">
              <AppleLogo className="w-3.5 h-3.5" />
              <span className="font-bold">Aura</span>
              {['File','Edit','View','Go','Window','Help'].map((item, index) => (
                <span 
                  key={item} 
                  className={`cursor-pointer hover:text-white/70 ${index > 2 ? 'hidden sm:inline' : ''} ${index > 3 ? 'hidden md:inline' : ''}`}
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-white">
              <Search className="w-3.5 h-3.5" />
              <span>Wed May 6 1:09 PM</span>
            </div>
          </div>
        </motion.div>

        {/* Section 4 — Inbox mockup */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl shadow-2xl"
          >
            {/* Title bar */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 relative">
              <div className="flex items-center gap-2 absolute left-4">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="w-full text-center text-xs text-white/50 font-medium">Aura — Inbox</div>
            </div>

            {/* Body */}
            <div className="flex flex-col md:grid md:grid-cols-12 h-auto md:h-[520px]">
              
              {/* Sidebar */}
              <div className="hidden md:flex flex-col col-span-3 border-r border-white/10 bg-black/30 p-4">
                <button className="flex items-center justify-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2 hover:bg-white/90 transition-colors w-full mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  Compose with Aura
                </button>

                <div className="flex flex-col gap-1 text-sm font-medium">
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-white/10 text-white cursor-pointer">
                    <span>Inbox</span>
                    <span className="text-xs">12</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-md text-white/60 hover:bg-white/5 cursor-pointer">
                    <span>Starred</span>
                    <span className="text-xs">3</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-md text-white/60 hover:bg-white/5 cursor-pointer">
                    <span>Sent</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-md text-white/60 hover:bg-white/5 cursor-pointer">
                    <span>Drafts</span>
                    <span className="text-xs">2</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-md text-white/60 hover:bg-white/5 cursor-pointer">
                    <span>Archive</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-md text-white/60 hover:bg-white/5 cursor-pointer">
                    <span>Trash</span>
                  </div>
                </div>

                <div className="mt-8 mb-2 px-3 text-[10px] uppercase tracking-widest text-white/40 font-semibold">Labels</div>
                <div className="flex flex-col gap-1 text-sm font-medium">
                  {[
                    { label: 'Work', color: '#00d2ff' },
                    { label: 'Personal', color: '#A4F4FD' },
                    { label: 'Travel', color: '#f59e0b' },
                    { label: 'Finance', color: '#10b981' }
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-white/60 hover:bg-white/5 cursor-pointer">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }}></div>
                      <span>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message list */}
              <div className="hidden md:flex flex-col col-span-4 border-r border-white/10 overflow-y-auto">
                <div className="p-3 border-b border-white/10 sticky top-0 bg-[#0e1014]/90 backdrop-blur-md z-10">
                  <div className="relative">
                    <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search mail" className="w-full bg-white/5 border border-white/10 rounded-md py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand/50" />
                  </div>
                </div>

                <div className="flex flex-col">
                  {/* Msg 1 */}
                  <div className="p-4 border-b border-white/5 bg-brand/10 cursor-pointer relative">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand"></div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-sm text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                        Linear
                      </span>
                      <span className="text-xs text-brand font-medium">9:41 AM</span>
                    </div>
                    <div className="text-sm font-medium text-white/90 mb-1 truncate">Weekly product digest</div>
                    <div className="text-xs text-white/50 truncate">Your team shipped 23 issues this week...</div>
                  </div>
                  {/* Msg 2 */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-sm text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                        Sophia Chen
                      </span>
                      <span className="text-xs text-brand font-medium">8:12 AM</span>
                    </div>
                    <div className="text-sm font-medium text-white/90 mb-1 truncate">Re: Q3 roadmap review</div>
                    <div className="text-xs text-white/50 truncate">Thanks for sending the deck over. I had a few thoughts...</div>
                  </div>
                  {/* Msg 3 */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-sm text-white/70">Figma</span>
                      <span className="text-xs text-white/40">Yesterday</span>
                    </div>
                    <div className="text-sm text-white/70 mb-1 truncate">Marcus commented on your file</div>
                    <div className="text-xs text-white/40 truncate">Love the new direction on the landing hero.</div>
                  </div>
                  {/* Msg 4 */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-sm text-white/70">Stripe</span>
                      <span className="text-xs text-white/40">Yesterday</span>
                    </div>
                    <div className="text-sm text-white/70 mb-1 truncate">Payout of $12,480.00 sent</div>
                    <div className="text-xs text-white/40 truncate">Your payout is on its way to your bank...</div>
                  </div>
                  {/* Msg 5 */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-sm text-white/70">Vercel</span>
                      <span className="text-xs text-white/40">Mon</span>
                    </div>
                    <div className="text-sm text-white/70 mb-1 truncate">Deployment ready for aura-web</div>
                    <div className="text-xs text-white/40 truncate">Preview is live at aura-web-g3f.vercel.app</div>
                  </div>
                  {/* Msg 6 */}
                  <div className="p-4 hover:bg-white/5 cursor-pointer">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-sm text-white/70">GitHub</span>
                      <span className="text-xs text-white/40">Mon</span>
                    </div>
                    <div className="text-sm text-white/70 mb-1 truncate">[aura/core] PR #482 approved</div>
                    <div className="text-xs text-white/40 truncate">david-lim approved your pull request.</div>
                  </div>
                </div>
              </div>

              {/* Reader */}
              <div className="flex flex-col col-span-12 md:col-span-5 h-[400px] md:h-auto overflow-y-auto bg-[#0a0c0f]">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-3 border-b border-white/10 sticky top-0 bg-[#0a0c0f]/90 backdrop-blur-md z-10">
                  <div className="flex gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-colors">
                      <Reply className="w-4 h-4" />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-colors">
                      <Forward className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1 self-center"></div>
                    <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-colors">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                  <h2 className="text-2xl font-semibold mb-6">Weekly product digest</h2>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-sm font-semibold">L</div>
                      <div>
                        <div className="text-sm font-semibold">Linear</div>
                        <div className="text-xs text-white/50">to me · 9:41 AM</div>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 rounded-full border border-white/10 text-xs font-medium bg-white/5">Work</div>
                  </div>

                  <div className="liquid-glass rounded-xl p-4 mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[#A4F4FD]" />
                      <span className="text-xs font-semibold text-[#A4F4FD]">Summary by Aura</span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Your team closed 23 issues, merged 14 PRs, and shipped 2 features. Top contributor: Marcus. No action needed.
                    </p>
                  </div>

                  <div className="space-y-4 text-sm text-white/80 leading-relaxed">
                    <p>Hi team,</p>
                    <p>Here is your weekly digest of everything happening across your projects. This was a strong week with significant progress on the Q3 roadmap.</p>
                    <p>Twenty-three issues were closed, fourteen pull requests were merged, and two customer-facing features went out. The velocity trend continues to climb.</p>
                    <p>Let me know if you would like a deeper breakdown by project or contributor.</p>
                    <p className="text-white/50 mt-6">— The Linear team</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-sm">
                      <Paperclip className="w-4 h-4 text-white/50" />
                      <span>digest-may-6.pdf</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </section>

        {/* Section 5 — FeatureTriage */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 w-full">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <SectionEyebrow label="Triage" tag="AI-native" />
              <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
                Clear your inbox <br /> in a single pass.
              </h2>
              <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
                Aura reads every message, understands intent, and routes the noise away from the signal. Focus on what moves your day forward — the rest handles itself.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-2">
                {['Auto-categorize', 'Snooze for later', 'Silent newsletters', 'One-tap unsubscribe'].map(chip => (
                  <span key={chip} className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="liquid-glass rounded-2xl p-5"
            >
              <div className="text-xs font-semibold text-white/50 mb-5">Today · 42 messages triaged</div>
              
              <div className="space-y-3">
                {[
                  { title: 'Priority', count: 4, color: '#ffffff', items: ['Sophia Chen — Q3 review', 'David Lim — contract signoff'] },
                  { title: 'Follow-up', count: 7, color: '#e5e5e5', items: ['Marcus — design review', 'Figma — comment thread'] },
                  { title: 'Updates', count: 18, color: '#a3a3a3', items: ['Vercel — deploy ready', 'GitHub — PR #482 merged'] },
                  { title: 'Archived', count: 13, color: '#525252', items: ['Stripe payout · Newsletter · Receipts'] },
                ].map((group) => (
                  <div key={group.title} className="liquid-glass rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.color }}></div>
                        <span className="text-sm font-semibold" style={{ color: group.color }}>{group.title}</span>
                      </div>
                      <span className="text-xs text-white/40">{group.count}</span>
                    </div>
                    <div className="pl-3.5 space-y-1">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="text-xs text-white/60 truncate">{item}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 6 — LogoCloud */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-20 w-full">
          <h3 className="text-center text-xs uppercase tracking-widest text-white/40">Trusted by the world&apos;s most thoughtful teams</h3>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 text-center">
            {['Linear', 'Vercel', 'Figma', 'Stripe', 'Ramp', 'Notion', 'Loom', 'Arc'].map((logo, i) => (
              <motion.div
                key={logo}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors cursor-default"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 7 — Testimonials */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 w-full border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Aura gave our leadership team four hours of their week back. It reads like email from the future.",
                name: "Parker Wilf",
                role: "Group Product Manager",
                company: "MERCURY"
              },
              {
                quote: "The command palette alone has changed how I process messages. I can't imagine going back to a traditional client.",
                name: "Andrew von Rosenbach",
                role: "Senior Engineering Program Manager",
                company: "COHERE"
              },
              {
                quote: "Triage that actually understands context. Our team stopped dreading Monday morning inboxes.",
                name: "Mathies Christensen",
                role: "Engineering Manager",
                company: "LUNAR"
              }
            ].map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="liquid-glass rounded-2xl p-6 flex flex-col justify-between h-full"
              >
                <blockquote className="text-sm text-white/80 leading-[1.6]">
                  &quot;{t.quote}&quot;
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="text-xs text-white/50">{t.role}</span>
                  <span className="mt-1 text-xs text-white font-semibold tracking-wide uppercase">{t.company}</span>
                </figcaption>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 8 — Pricing */}
        <section className="c3-pricing-section w-full">
          {/* Pricing SVG Noise Filter */}
          <svg className="absolute w-0 h-0 pointer-events-none">
            <filter id="c3-noise-pricing">
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
              <feComponentTransfer><feFuncA type="linear" slope="0.075" /></feComponentTransfer>
              <feComposite in2="SourceGraphic" operator="in" result="noise" />
              <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
            </filter>
          </svg>

          <div className="c3-watermark-container">
            <div className="c3-watermark-main">
              <span className="c3-watermark-line-1">Your email.</span>
              <span className="c3-watermark-line-2">Revitalized</span>
            </div>
          </div>

          <div className="c3-grid">
            {/* Free */}
            <div className="c3-card">
              <div className="c3-tier-small">Free</div>
              <div className="c3-tier-large">Free</div>
              <div className="c3-desc">For creators taking their first steps with Forma.</div>
              <ul className="c3-list">
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Up to 3 projects in the cloud</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Image export up to 1080p</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Basic editing tools</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Free templates and icons</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Access via web and mobile app</li>
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

            {/* Standard */}
            <div className="c3-card">
              <div className="c3-tier-small">Standard</div>
              <div className="c3-tier-large">{yearly ? '$99,99/y' : '$9,99/m'}</div>
              <div className="c3-desc">For freelancers and small teams who need more freedom and flexibility.</div>
              <ul className="c3-list">
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Up to 50 projects in the cloud</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Export up to 4K</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Advanced editing toolkit</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Team collaboration (up to 5 members)</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Access to premium template library</li>
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

            {/* Pro */}
            <div className="c3-card c3-card-pro">
              <div className="c3-tier-small">Pro</div>
              <div className="c3-tier-large">{yearly ? '$199,99/y' : '$19,99/m'}</div>
              <div className="c3-desc">For studios, agencies, and professional creators working with brands.</div>
              <ul className="c3-list">
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Unlimited projects</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Export up to 8K + animations</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> AI-powered content generation tools</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Unlimited team members</li>
                <li><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Brand customization</li>
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>
          </div>

          <div className="c3-toggle-wrap">
            <span className="text-sm font-medium text-white/80">Yearly</span>
            <button 
              className={`c3-toggle ${yearly ? 'active' : ''}`}
              onClick={() => setYearly(!yearly)}
            >
              <div className="c3-toggle-knob"></div>
            </button>
          </div>
        </section>

        {/* Section 9 — FinalCTA */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
          >
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)',
                opacity: 0.3
              }}
            ></div>
            
            <h2 className="relative z-10 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
              Close the tabs.<br />Open your day.
            </h2>
            <p className="relative z-10 mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
              Join thousands of builders, founders, and operators who treat email like a tool — not an obligation.
            </p>
            
            <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <AppleButton />
              <button className="flex items-center justify-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors">
                Talk to sales
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Footer padding */}
        <div className="h-12 w-full"></div>
      </div>
    </div>
  );
}
