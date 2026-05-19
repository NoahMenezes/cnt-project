import type { Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  Show,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "SecureEmail — Encrypted Email System",
  description:
    "Military-grade email encryption with hybrid RSA + AES. Protect your sensitive emails and attachments with end-to-end encryption.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0c0c0c] text-white`}>
        <ClerkProvider>
          {/* Global Navbar */}
          <header className="fixed w-full top-0 z-[9999] flex items-center justify-between px-6 md:px-10 h-16 bg-black/30 backdrop-blur-md border-b border-white/[0.06] pointer-events-auto">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_16px_rgba(0,210,255,0.4)]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M8 5.5L10.5 7V10L8 11.5L5.5 10V7L8 5.5Z" fill="white"/>
                </svg>
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">CipherChat</span>
            </div>

            {/* Auth Controls */}
            <div className="flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton mode="redirect">
                  <button className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.06] cursor-pointer">
                    Sign in
                  </button>
                </SignInButton>
                <SignInButton mode="redirect">
                  <button className="flex items-center gap-2 text-sm font-semibold bg-white text-black px-5 py-2 rounded-full hover:bg-white/90 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer">
                    Get started
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8H13M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 ring-2 ring-white/20 hover:ring-cyan-400/50 transition-all",
                    }
                  }}
                />
              </Show>
            </div>
          </header>

          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
