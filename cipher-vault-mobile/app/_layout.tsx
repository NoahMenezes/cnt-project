import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0a0a0f" },
          headerTintColor: "#e2e8f0",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#0a0a0f" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="scan"
          options={{ title: "Scan QR Code", headerShown: true }}
        />
        <Stack.Screen
          name="decrypt"
          options={{ title: "Decrypt Payload", headerShown: true }}
        />
        <Stack.Screen
          name="inbox"
          options={{ title: "Secure Inbox", headerShown: true }}
        />
      </Stack>
    </>
  );
}
