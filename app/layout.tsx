import type { Metadata } from 'next'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SecureShare - End-to-End Encrypted Platform',
  description: 'Securely share files and messages with end-to-end encryption.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
          <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md flex justify-between items-center px-6 lg:px-12 h-16">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SecureShare
            </Link>
            <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-400">
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link href="/upload" className="hover:text-white transition-colors">Upload</Link>
              <Link href="/messages" className="hover:text-white transition-colors">Messages</Link>
              <Link href="/key-management" className="hover:text-white transition-colors">Keys</Link>
            </nav>
            <div className="flex items-center gap-4">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium hover:text-white transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    Get Started
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          <main className="flex-1 mt-16">
            {children}
          </main>
          <footer className="py-8 border-t border-white/5 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} SecureShare. Built with 🔐 Hybrid Encryption.
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
