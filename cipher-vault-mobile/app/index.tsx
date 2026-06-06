import { useActionSheet } from "@expo/react-native-action-sheet";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId, getDeviceName } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const id = await getDeviceId();
      const name = await getDeviceName();
      setDeviceId(id);
      setDeviceName(name);
      if (id) {
        const { count } = await supabase
          .from("ephemeral_transfers")
          .select("*", { count: "exact", head: true })
          .eq("device_id", id);
        setPendingCount(count ?? 0);
      }
      setLoading(false);
    }
    load();
  }, []);

  function openActionsSheet() {
    const options = deviceId
      ? ["Open Inbox", "Scan New QR Code", "Decrypt Payload", "Cancel"]
      : ["Scan QR Code to Pair", "Cancel"];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        containerStyle: {
          backgroundColor: isDarkColorScheme ? "#0a0a14" : "#ffffff",
        },
        textStyle: { color: colors.foreground },
      },
      (selectedIndex) => {
        if (deviceId) {
          if (selectedIndex === 0) router.push("/inbox");
          if (selectedIndex === 1) router.push("/scan");
          if (selectedIndex === 2) router.push("/decrypt");
        } else {
          if (selectedIndex === 0) router.push("/scan");
        }
      }
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "CipherVault",
          headerLargeTitle: true,
          headerTransparent: true,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="p-4"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <View className="gap-4">

            {/* Device Status Card */}
            <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
              <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
                Device Status
              </Text>
              <View className="items-center gap-2">
                {deviceId ? (
                  <>
                    <View className="w-3 h-3 rounded-full bg-green-500" />
                    <Text className="text-foreground text-base font-semibold">
                      {deviceName ?? "My Device"}
                    </Text>
                    <Text className="text-muted-foreground text-xs font-mono">
                      {deviceId.substring(0, 16)}…
                    </Text>
                    {pendingCount > 0 && (
                      <View className="mt-1 px-3 py-1 rounded-full bg-primary">
                        <Text className="text-primary-foreground text-xs font-bold">
                          {pendingCount} payload{pendingCount !== 1 ? "s" : ""} waiting
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <View className="w-3 h-3 rounded-full bg-yellow-500" />
                    <Text className="text-foreground text-base font-semibold">
                      Not Paired
                    </Text>
                    <Text className="text-muted-foreground text-xs text-center">
                      Scan the QR code from the web app to pair this device.
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Quick Actions Card */}
            <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
              <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
                Quick Actions
              </Text>

              <TouchableOpacity
                onPress={openActionsSheet}
                className="bg-primary rounded-lg py-3 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-primary-foreground font-semibold text-sm">
                  Open Actions
                </Text>
              </TouchableOpacity>
            </View>

            {/* Navigation Cards */}
            {deviceId && (
              <View className="border-border bg-card gap-3 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
                  Navigation
                </Text>

                <TouchableOpacity
                  onPress={() => router.push("/inbox")}
                  className="border-border flex-row items-center justify-between rounded-lg border px-4 py-3"
                  activeOpacity={0.7}
                >
                  <Text className="text-foreground font-medium text-sm">Secure Inbox</Text>
                  {pendingCount > 0 && (
                    <View className="px-2 py-0.5 rounded-full bg-primary">
                      <Text className="text-primary-foreground text-[11px] font-bold">
                        {pendingCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/decrypt")}
                  className="border-border flex-row items-center justify-between rounded-lg border px-4 py-3"
                  activeOpacity={0.7}
                >
                  <Text className="text-foreground font-medium text-sm">Decrypt Payload</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/scan")}
                  className="border-border flex-row items-center justify-between rounded-lg border px-4 py-3"
                  activeOpacity={0.7}
                >
                  <Text className="text-muted-foreground font-medium text-sm">Re-pair Device</Text>
                </TouchableOpacity>
              </View>
            )}

            {!deviceId && (
              <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
                  Get Started
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/scan")}
                  className="border-border rounded-lg border px-4 py-3 items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-foreground font-semibold text-sm">Scan QR Code</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Security Note Card */}
            <View className="border-border bg-card rounded-xl border p-4 shadow-sm shadow-black/10 dark:shadow-none">
              <Text className="text-muted-foreground text-xs text-center leading-5">
                🔐 RSA private keys are stored exclusively in this device's hardware enclave and are never transmitted.
              </Text>
            </View>

          </View>
        )}
      </ScrollView>
    </>
  );
}
