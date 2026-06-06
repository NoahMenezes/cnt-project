import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Shield, QrCode, Inbox, Lock, Laptop } from "lucide-react-native";

import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId, getDeviceName } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import ShieldGraphic from "@/components/ShieldGraphic";
import CustomSheet from "@/components/CustomSheet";

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useColorScheme();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

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

  useEffect(() => {
    if (!deviceId) return;
    const channel = supabase
      .channel("home_realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ephemeral_transfers",
        filter: `device_id=eq.${deviceId}`,
      }, (payload) => {
        setPendingCount((prev) => prev + 1);
        Alert.alert(
          "New Transfer Received",
          `Encrypted document "${payload.new.document_name || "Secure Package"}" has been sent from the web console.`,
          [
            { text: "View Inbox", onPress: () => router.push("/inbox") },
            { text: "Dismiss", style: "cancel" },
          ]
        );
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "ephemeral_transfers",
        filter: `device_id=eq.${deviceId}`,
      }, () => {
        setPendingCount((prev) => Math.max(0, prev - 1));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const actionSheetOptions = deviceId
    ? [
        { label: "Open Secure Inbox", onPress: () => router.push("/inbox") },
        { label: "Scan New QR Code", onPress: () => router.push("/scan") },
        { label: "Decrypt Payload", onPress: () => router.push("/decrypt") },
      ]
    : [
        { label: "Scan QR Code to Pair", onPress: () => router.push("/scan") },
      ];

  return (
    <View className="flex-1 bg-background" style={{ overflow: "hidden" }}>
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
        contentContainerStyle={{ paddingTop: 140, paddingBottom: 60, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-md gap-5">
          
          {/* Header Graphic */}
          <ShieldGraphic />

          {loading ? (
            <View className="border-border bg-card rounded-xl border p-8 items-center justify-center shadow-sm shadow-black/10 dark:shadow-none">
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <View className="gap-4">
              
              {/* Device Status Card */}
              <View className="border-border bg-card gap-4 rounded-xl border p-5 shadow-sm shadow-black/10 dark:shadow-none">
                <View className="flex-row items-center justify-between border-b border-border pb-3">
                  <View className="flex-row items-center gap-2">
                    <Laptop size={16} color={colors.primary} />
                    <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                      Device Status
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className={`w-2.5 h-2.5 rounded-full ${deviceId ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <Text className={`text-xs font-bold ${deviceId ? "text-emerald-500" : "text-amber-500"}`}>
                      {deviceId ? "Paired" : "Unlinked"}
                    </Text>
                  </View>
                </View>

                {deviceId ? (
                  <View>
                    <Text className="text-foreground text-lg font-bold">
                      {deviceName ?? "My Device"}
                    </Text>
                    <Text className="text-foreground opacity-60 text-xs font-mono mb-2 mt-0.5">
                      ID: {deviceId.substring(0, 16)}...
                    </Text>
                    {pendingCount > 0 && (
                      <View className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex-row items-center justify-between mt-2">
                        <Text className="text-primary text-xs font-semibold">
                          Pending Transfers
                        </Text>
                        <View className="bg-primary px-2.5 py-1 rounded-full">
                          <Text className="text-white text-[10px] font-bold">{pendingCount}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View>
                    <Text className="text-foreground opacity-60 text-sm mb-3.5 leading-5">
                      Link this mobile app to your web terminal to manage and decrypt your documents.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/scan")}
                      className="bg-primary rounded-xl py-3 items-center flex-row justify-center gap-2 active:opacity-85"
                    >
                      <QrCode size={16} color="#fff" />
                      <Text className="text-white font-bold text-sm">Pair Device</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Quick Actions Card */}
              <View className="border-border bg-card gap-4 rounded-xl border p-5 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-foreground opacity-60 text-center text-xs font-semibold uppercase tracking-wider">
                  Quick Actions
                </Text>
                
                <View className="gap-2.5 mt-1">
                  <TouchableOpacity
                    onPress={() => setSheetVisible(true)}
                    className="bg-primary rounded-xl py-3.5 items-center justify-center active:opacity-85 shadow-sm"
                  >
                    <Text className="text-white font-bold text-sm">Open Menu</Text>
                  </TouchableOpacity>

                  {deviceId && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => router.push("/inbox")}
                        className="flex-1 border border-border bg-background rounded-xl py-3.5 items-center justify-center flex-row gap-2 active:opacity-85"
                      >
                        <Inbox size={15} color={colors.primary} />
                        <Text className="text-foreground font-semibold text-sm">Inbox</Text>
                        {pendingCount > 0 && (
                          <View className="bg-primary px-2 py-0.5 rounded-full">
                            <Text className="text-white text-[9px] font-bold">{pendingCount}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Security Banner */}
              <View className="border-border bg-card rounded-xl border p-4 shadow-sm shadow-black/10 dark:shadow-none">
                <View className="flex-row gap-2.5 items-center justify-center">
                  <Lock size={14} color="#64748b" />
                  <Text className="text-[11px] text-foreground opacity-60 text-center leading-5">
                    RSA private keys are saved inside local hardware keychain enclaves.
                  </Text>
                </View>
              </View>

            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom motion sheet popup */}
      <CustomSheet
        visible={sheetVisible}
        title="Menu"
        options={actionSheetOptions}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}
