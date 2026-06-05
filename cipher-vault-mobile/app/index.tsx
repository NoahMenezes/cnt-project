import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Shield, Smartphone, ScanLine, Inbox, Key } from "lucide-react-native";
import { getDeviceId, getDeviceName, getPrivateKey } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const id = await getDeviceId();
      const name = await getDeviceName();
      const key = await getPrivateKey();
      setDeviceId(id);
      setDeviceName(name);
      setHasKey(!!key);

      if (id) {
        const { data } = await supabase
          .from("ephemeral_transfers")
          .select("id")
          .eq("device_id", id);
        setPendingCount(data?.length ?? 0);
      }
      setLoading(false);
    }
    init();
  }, []);

  // Real-time badge update
  useEffect(() => {
    if (!deviceId) return;
    const channel = supabase
      .channel("home_badge")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ephemeral_transfers",
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          supabase
            .from("ephemeral_transfers")
            .select("id")
            .eq("device_id", deviceId)
            .then(({ data }) => setPendingCount(data?.length ?? 0));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0f]">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      {/* Blue blur glow — top-right corner */}
      <View
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
        style={{
          backgroundColor: "#6366f1",
          transform: [{ translateX: 80 }, { translateY: -80 }],
          shadowColor: "#6366f1",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 80,
          elevation: 30,
        }}
      />
      {/* Blue blur glow — bottom-left corner */}
      <View
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
        style={{
          backgroundColor: "#3b82f6",
          transform: [{ translateX: -60 }, { translateY: 60 }],
          shadowColor: "#3b82f6",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 60,
          elevation: 20,
        }}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 72, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-10 h-10 rounded-xl bg-indigo-500/20 items-center justify-center border border-indigo-500/30">
              <Shield size={20} color="#6366f1" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-white tracking-tight">
                CipherVault
              </Text>
              <Text className="text-xs text-slate-500 font-medium tracking-widest uppercase">
                Mobile Decryption Node
              </Text>
            </View>
          </View>
        </View>

        {/* Device Status Card */}
        <View className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-5 mb-4 shadow-sm">
          <View className="flex-row items-center gap-3 mb-4">
            <Smartphone size={16} color="#6366f1" />
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Device Status
            </Text>
          </View>
          {deviceId ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-500">Device Name</Text>
                <Text className="text-xs font-mono text-white font-semibold">
                  {deviceName ?? "Unknown"}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-500">Device ID</Text>
                <Text className="text-xs font-mono text-slate-400 max-w-[160px]" numberOfLines={1}>
                  {deviceId}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-500">Private Key</Text>
                <View
                  className={`px-2 py-0.5 rounded-full ${hasKey ? "bg-emerald-500/15" : "bg-red-500/15"}`}
                >
                  <Text
                    className={`text-[10px] font-bold ${hasKey ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {hasKey ? "● SECURED" : "● NOT SET"}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-500">Pending Payloads</Text>
                <View className="px-2 py-0.5 rounded-full bg-indigo-500/15">
                  <Text className="text-[10px] font-bold text-indigo-400">
                    {pendingCount} WAITING
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-slate-400 text-sm mb-3">
                Device not paired. Scan a QR code from your CipherVault web app to link this device.
              </Text>
            </View>
          )}
        </View>

        {/* Action Cards */}
        <View className="gap-3">
          {/* Scan QR */}
          <TouchableOpacity
            onPress={() => router.push("/scan")}
            className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 active:opacity-70"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-11 h-11 rounded-xl bg-indigo-500/20 items-center justify-center">
                <ScanLine size={22} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white mb-0.5">
                  Scan QR Code
                </Text>
                <Text className="text-xs text-slate-500">
                  Pair this device with your web app
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Secure Inbox */}
          <TouchableOpacity
            onPress={() => {
              if (!deviceId) {
                Alert.alert(
                  "Not Paired",
                  "Scan a QR code from the web app first to pair this device."
                );
                return;
              }
              router.push("/inbox");
            }}
            className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-5 active:opacity-70"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-11 h-11 rounded-xl bg-slate-800 items-center justify-center relative">
                <Inbox size={22} color="#e2e8f0" />
                {pendingCount > 0 && (
                  <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 items-center justify-center">
                    <Text className="text-[10px] font-bold text-white">
                      {pendingCount}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white mb-0.5">
                  Secure Inbox
                </Text>
                <Text className="text-xs text-slate-500">
                  {pendingCount > 0
                    ? `${pendingCount} encrypted payload${pendingCount > 1 ? "s" : ""} waiting`
                    : "No pending payloads"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Private Key */}
          <TouchableOpacity
            onPress={() => router.push("/decrypt")}
            className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-5 active:opacity-70"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-11 h-11 rounded-xl bg-slate-800 items-center justify-center">
                <Key size={22} color="#94a3b8" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white mb-0.5">
                  Manage Private Key
                </Text>
                <Text className="text-xs text-slate-500">
                  Import or update your RSA private key
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View className="mt-8 rounded-xl border border-[#1e1e2e] bg-[#111118] p-4">
          <Text className="text-[11px] text-slate-600 text-center leading-5">
            🔐 This device decrypts payloads sent from the CipherVault web platform.{"\n"}
            Private keys never leave this device.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
