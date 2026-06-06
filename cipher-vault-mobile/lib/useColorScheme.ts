import { useColorScheme as useNativeColorScheme } from "react-native";

const COLORS = {
  light: {
    background: "#050814", // Cryptographic midnight blue
    foreground: "#ffffff",
    card: "#0d1527",
    cardForeground: "#ffffff",
    primary: "#6366f1",
    primaryForeground: "#ffffff",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    border: "#1e293b",
    destructive: "#ef4444",
  },
  dark: {
    background: "#050814", // Cryptographic midnight blue
    foreground: "#ffffff",
    card: "#0d1527",
    cardForeground: "#ffffff",
    primary: "#6366f1",
    primaryForeground: "#ffffff",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    border: "#1e293b",
    destructive: "#ef4444",
  },
};

export function useColorScheme() {
  const colorScheme: "light" | "dark" = "dark";
  const colors = COLORS[colorScheme];
  return { colorScheme, colors, isDarkColorScheme: true };
}
