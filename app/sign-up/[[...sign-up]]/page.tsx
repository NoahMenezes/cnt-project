import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center relative overflow-hidden pt-16">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header above the card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,210,255,0.4)]">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 5.5L10.5 7V10L8 11.5L5.5 10V7L8 5.5Z" fill="white"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create account</h1>
          <p className="mt-1.5 text-sm text-white/50">Generate your cryptographic keys and get started</p>
        </div>

        {/* Clerk Sign Up Component */}
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[#111113] border border-white/10 shadow-2xl rounded-2xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all rounded-xl",
              socialButtonsBlockButtonText: "text-white/80 font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-white/30 text-xs",
              formFieldLabel: "text-white/60 text-xs font-medium uppercase tracking-wider",
              formFieldInput:
                "bg-black/40 border border-white/10 text-white rounded-xl focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 placeholder:text-white/20 transition-all",
              formButtonPrimary:
                "bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]",
              footerActionLink: "text-cyan-400 hover:text-cyan-300 font-medium",
              formFieldErrorText: "text-red-400 text-xs",
              alertText: "text-red-300 text-sm",
            },
          }}
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
