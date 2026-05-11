"use client";

import './globals.css';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

function Navbar() {
    return (
        <header style={{
            position: 'fixed', top: 0, width: '100%', zIndex: 100,
            borderBottom: '1px solid var(--border-glow)',
            background: 'rgba(10, 10, 15, 0.85)',
            backdropFilter: 'blur(16px)',
        }}>
            <div style={{
                maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', height: 64
            }}>
                <Link href="/" style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    textDecoration: 'none', color: 'var(--accent-primary)',
                }}>
                    <Shield size={24} />
                    <span className="font-display" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                        DecenChat
                    </span>
                </Link>
            </div>
        </header>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={cn("font-sans", geist.variable)}>
            <head>
                <title>DecenChat — Trustless. Serverless. Unbreakable.</title>
                <meta name="description" content="Decentralized end-to-end encrypted messenger. RSA+AES hybrid encryption on Ethereum. No server. No backdoor. Just math." />
            </head>
            <body>
                <Navbar />
                <main style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
                    {children}
                </main>
            </body>
        </html>
    );
}
