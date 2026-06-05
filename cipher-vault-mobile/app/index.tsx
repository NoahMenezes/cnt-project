import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Shield, QrCode, Inbox, Lock, Smartphone } from "lucide-react-native";
import { getDeviceId, getDeviceName } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const router = useRouter();
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

  if (loading) {
    return (
      <View className="flex-1 bg-[#0a0a0f] items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      {/* Blue glow top-right */}
      <View
        className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20"
        style={{
          backgroundColor: "#6366f1",
          transform: [{ translateX: 80 }, { translateY: -80 }],
          shadowColor: "#6366f1",
          shadowRadius: 100,
          shadowOpacity: 1,
          elevation: 30,
        }}
      />
      {/* Blue glow bottom-left */}
      <View
        className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10"
        style={{
          backgroundColor: "#3b82f6",
          transform: [{ translateX: -60 }, { translateY: 60 }],
          shadowColor: "#3b82f6",
          shadowRadius: 80,
          shadowOpacity: 1,
          elevation: 20,
        }}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 70, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-10 h-10 rounded-xl bg-indigo-500/20 items-center justify-center">
              <Shield size={20} color="#6366f1" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-white">CipherVault</Text>
              <Text className="text-xs text-slate-500">Mobile Decryption Node</Text>
            </View>
          </View>
        </View>

        {/* Device Status Card */}
        <View className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-5 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Smartphone size={14} color="#6366f1" />
            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Device Status
            </Text>
          </View>

          {deviceId ? (
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-2 h-2 rounded-full bg-emerald-400" />
                <Text className="text-sm font-semibold text-emerald-400">
                  Paired & Active
                </Text>
              </View>
              <Text className="text-base font-bold text-white mb-0.5">
                {deviceName ?? "My Device"}
              </Text>
              <Text className="text-[10px] font-mono text-slate-600">
                {deviceId.substring(0, 8)}...
              </Text>
            </View>
          ) : (
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-2 h-2 rounded-full bg-orange-400" />
                <Text className="text-sm font-semibold text-orange-400">
                  Not Paired
                </Text>
              </View>
              <Text className="text-xs text-slate-500">
                Scan the QR code from the web app to pair this device.
              </Text>
            </View>
          )}
        </View>

        {/* Inbox count */}
        {deviceId && pendingCount > 0 && (
          <View className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 mb-4 flex-row items-center gap-3">
            <Lock size={18} color="#6366f1" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">
                {pendingCount} encrypted payload{pendingCount !== 1 ? "s" : ""} waiting
              </Text>
              <Text className="text-xs text-slate-500">
                Open your inbox to decrypt them
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="gap-3 mt-2">
          {!deviceId && (
            <TouchableOpacity
              onPress={() => router.push("/scan")}
              className="rounded-2xl bg-indigo-500 p-4 flex-row items-center gap-3 active:opacity-80"
            >
              <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                <QrCode size={18} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-sm">Scan QR Code</Text>
                <Text className="text-indigo-200 text-xs">
                  Pair this device with the web app
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push("/inbox")}
            className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 flex-row items-center gap-3 active:opacity-70"
          >
            <View className="w-9 h-9 rounded-xl bg-indigo-500/15 items-center justify-center">
              <Inbox size={18} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Secure Inbox</Text>
              <Text className="text-slate-500 text-xs">
                View and decrypt received payloads
              </Text>
            </View>
            {pendingCount > 0 && (
              <View className="px-2 py-0.5 rounded-full bg-indigo-500">
                <Text className="text-white text-[10px] font-bold">
                  {pendingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {deviceId && (
            <TouchableOpacity
              onPress={() => router.push("/scan")}
              className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 flex-row items-center gap-3 active:opacity-70"
            >
              <View className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center">
                <QrCode size={18} color="#94a3b8" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-300 font-bold text-sm">Re-pair Device</Text>
                <Text className="text-slate-500 text-xs">
                  Link to a different web account
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Security note */}
        <View className="mt-6 rounded-xl bg-[#111118] border border-[#1e1e2e] p-4">
          <View className="flex-row items-start gap-2">
            <Shield size={13} color="#6366f1" />
            <Text className="text-[11px] text-slate-600 leading-5 flex-1">
              RSA private keys are stored exclusively in this device's hardware
              enclave and are never transmitted to any server.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
