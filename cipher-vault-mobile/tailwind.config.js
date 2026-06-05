/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        card: "#111118",
        border: "#1e1e2e",
        primary: "#6366f1",
        "primary-foreground": "#ffffff",
        foreground: "#e2e8f0",
        muted: "#94a3b8",
        destructive: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
