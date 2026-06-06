import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Shield, QrCode, Inbox, Lock, Laptop } from "lucide-react-native";

import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId, getDeviceName } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import ShieldGraphic from "@/components/ShieldGraphic";
import AnimatedCard from "@/components/AnimatedCard";
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
    <View className="flex-1 bg-[#0a0a0f]">
      {/* Background glow effects */}
      <View
        className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20"
        style={{
          backgroundColor: "#4f46e5",
          transform: [{ translateX: 100 }, { translateY: -100 }],
          shadowColor: "#4f46e5",
          shadowRadius: 100,
          shadowOpacity: 1,
          elevation: 25,
        }}
      />
      <View
        className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
        style={{
          backgroundColor: "#818cf8",
          transform: [{ translateX: -80 }, { translateY: 80 }],
          shadowColor: "#818cf8",
          shadowRadius: 80,
          shadowOpacity: 1,
          elevation: 20,
        }}
      />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 gap-6">
          
          {/* Header */}
          <View className="flex-row items-center gap-3 justify-center mb-2">
            <View className="w-12 h-12 rounded-2xl bg-indigo-500/10 items-center justify-center border border-indigo-500/20">
              <Shield size={24} color="#818cf8" />
            </View>
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight">CipherVault</Text>
              <Text className="text-slate-500 text-xs font-semibold">Secure Mobile Node</Text>
            </View>
          </View>

          {/* Core Graphic */}
          <ShieldGraphic />

          {loading ? (
            <View className="py-10">
              <ActivityIndicator color="#818cf8" size="large" />
            </View>
          ) : (
            <View className="gap-4">
              
              {/* Device Status Card */}
              <AnimatedCard delay={100} className="p-5">
                <View className="flex-row items-center justify-between mb-4 border-b border-slate-900 pb-3">
                  <View className="flex-row items-center gap-2">
                    <Laptop size={16} color="#818cf8" />
                    <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
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
                    <Text className="text-white text-lg font-bold mb-1">
                      {deviceName ?? "My Device"}
                    </Text>
                    <Text className="text-slate-500 text-xs font-mono mb-2">
                      ID: {deviceId.substring(0, 16)}…
                    </Text>
                    {pendingCount > 0 && (
                      <View className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 flex-row items-center justify-between">
                        <Text className="text-indigo-300 text-xs font-semibold">
                          Pending Transfers
                        </Text>
                        <View className="bg-indigo-500 px-2.5 py-1 rounded-full">
                          <Text className="text-white text-[10px] font-bold">{pendingCount}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View>
                    <Text className="text-slate-300 text-sm mb-3">
                      Link this mobile app to your web terminal to manage and decrypt your documents.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/scan")}
                      className="bg-indigo-600 rounded-xl py-3 items-center flex-row justify-center gap-2 active:bg-indigo-700"
                    >
                      <QrCode size={16} color="#fff" />
                      <Text className="text-white font-bold text-sm">Pair Device</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </AnimatedCard>

              {/* Quick Actions Card */}
              <AnimatedCard delay={200} className="p-5">
                <Text className="text-slate-400 text-center text-xs font-semibold uppercase tracking-wider mb-4">
                  Quick Actions
                </Text>
                
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => setSheetVisible(true)}
                    className="bg-indigo-600 rounded-xl py-3.5 items-center justify-center active:bg-indigo-700 shadow-lg shadow-indigo-600/30"
                  >
                    <Text className="text-white font-bold text-sm">Open Menu</Text>
                  </TouchableOpacity>

                  {deviceId && (
                    <TouchableOpacity
                      onPress={() => router.push("/inbox")}
                      className="border border-[#1e1e2d] bg-[#151520]/40 rounded-xl py-3.5 items-center justify-center flex-row gap-2 active:bg-[#1e1e2d]"
                    >
                      <Inbox size={15} color="#818cf8" />
                      <Text className="text-slate-300 font-semibold text-sm">Inbox</Text>
                      {pendingCount > 0 && (
                        <View className="bg-indigo-500 px-2 py-0.5 rounded-full">
                          <Text className="text-white text-[9px] font-bold">{pendingCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </AnimatedCard>

              {/* Security Banner */}
              <AnimatedCard delay={300} className="p-4 bg-slate-950/20 border border-slate-900">
                <View className="flex-row gap-2.5 items-center justify-center">
                  <Lock size={14} color="#475569" />
                  <Text className="text-[11px] text-slate-500 text-center leading-5">
                    RSA private keys are saved inside local hardware keychain enclaves.
                  </Text>
                </View>
              </AnimatedCard>

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
