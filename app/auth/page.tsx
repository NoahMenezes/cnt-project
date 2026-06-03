import { SignIn } from "@clerk/nextjs";

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <SignIn
        routing="hash"
        forceRedirectUrl="/"
        appearance={{
          variables: {
            colorBackground: "#09090b",
            colorInputBackground: "#18181b",
            colorInputText: "#ffffff",
            colorText: "#ffffff",
            colorTextSecondary: "#a1a1aa",
            colorPrimary: "#ffffff",
            colorDanger: "#f87171",
            borderRadius: "0.75rem",
            fontFamily: "var(--font-geist-sans)",
          },
          elements: {
            card: "border border-zinc-800 shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton:
              "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800",
            formFieldInput:
              "bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:border-white",
            formButtonPrimary:
              "bg-white text-black hover:bg-zinc-200 font-semibold",
            footerActionLink: "text-zinc-300 hover:text-white",
            dividerLine: "bg-zinc-800",
            dividerText: "text-zinc-500",
          },
        }}
      />
    </div>
  );
}
