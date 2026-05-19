import type { Metadata } from 'next'
import { ClerkProvider, Show, UserButton } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import { RippleButton } from "@/components/ui/ripple-button"
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
  title: "CipherChat — End-to-End Encrypted Messaging",
  description:
    "Secure real-time messaging with hybrid RSA + AES encryption. Your messages, only yours.",
}

export function RippleButtonDemo() {
  return <RippleButton rippleColor="#ADD8E6">Click me</RippleButton>
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
          <header className="absolute w-full top-0 z-50 flex justify-end items-center p-4 gap-4 h-16 pointer-events-auto">
            <RippleButtonDemo />
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
