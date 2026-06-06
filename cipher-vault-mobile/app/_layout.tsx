import "../global.css";

import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/theme";

export default function RootLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const navTheme = NAV_THEME[colorScheme];

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? "light" : "dark"}`}
        style={isDarkColorScheme ? "light" : "dark"}
      />
      <ActionSheetProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: navTheme.card },
            headerTintColor: navTheme.text,
            headerTitleStyle: { fontWeight: "700", color: navTheme.text },
            contentStyle: { backgroundColor: navTheme.background },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ title: "Scan QR Code" }} />
          <Stack.Screen name="inbox" options={{ title: "Secure Inbox" }} />
          <Stack.Screen name="decrypt" options={{ title: "Decrypt Payload" }} />
        </Stack>
      </ActionSheetProvider>
    </>
  );
}
