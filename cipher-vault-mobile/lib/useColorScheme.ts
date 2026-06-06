import { useColorScheme as useNativeColorScheme } from "react-native";

const COLORS = {
  light: {
    background: "#ffffff",
    foreground: "#0f172a",
    card: "#f8fafc",
    cardForeground: "#0f172a",
    primary: "#4f46e5",
    primaryForeground: "#ffffff",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    border: "#e2e8f0",
    destructive: "#ef4444",
  },
  dark: {
    background: "#0a0a0f",
    foreground: "#ffffff",
    card: "#111118",
    cardForeground: "#ffffff",
    primary: "#6366f1",
    primaryForeground: "#ffffff",
    muted: "#1e1e2d",
    mutedForeground: "#94a3b8",
    border: "#1e1e2d",
    destructive: "#ef4444",
  },
};

export function useColorScheme() {
  const colorScheme = useNativeColorScheme() ?? "dark";
  const colors = COLORS[colorScheme];
  return { colorScheme, colors, isDarkColorScheme: colorScheme === "dark" };
}
