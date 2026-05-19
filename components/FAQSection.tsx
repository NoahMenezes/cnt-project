"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does CipherChat ensure zero server visibility?",
    answer: "All cryptography happens on your local device. Before transmission, your message is sealed with AES-256 using a session key. The session key is encrypted with the recipient's RSA public key. The server acts as a blind postman, routing encrypted packets without any ability to decrypt the content."
  },
  {
    question: "Where are my private keys stored?",
    answer: "Your 2048-bit RSA private keys are generated locally on your device and saved securely inside local sandboxed client storage. They never cross the network, and our servers have zero capability to request or access them."
  },
  {
    question: "What happens if CipherChat's database is hacked?",
    answer: "Because we maintain a zero-knowledge database architecture, only ciphertext payloads are stored in the history. Even if a bad actor compromises the database servers, the leaked logs are completely unreadable since the private keys required for decryption exist only on our users' local devices."
  },
  {
    question: "How is real-time performance maintained with encryption?",
    answer: "Asymmetric RSA encryption can be slow for large files or long messages. CipherChat solves this by using hybrid encryption: fast AES-256 (symmetric) encrypts the actual message body, and RSA-2048 (asymmetric) secures the lightweight AES key. This delivers sub-100ms transit speeds with absolute security."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full py-20 px-6 max-w-4xl mx-auto relative z-20">
      <div className="text-center mb-16">
        <span className="text-xs uppercase tracking-widest text-[#00d2ff] font-semibold bg-[#00d2ff]/10 px-3 py-1 rounded-full">
          FAQ
        </span>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-white/50 max-w-md mx-auto text-sm leading-relaxed">
          Got questions about the cryptographic handshake or security protocols? We have answers.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className="liquid-glass border border-white/10 rounded-xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-6 text-left text-white font-medium hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 pr-4">
                  <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-sm md:text-base leading-snug">{faq.question}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-1 text-xs md:text-sm text-white/60 leading-relaxed border-t border-white/5 bg-white/[0.01]">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
