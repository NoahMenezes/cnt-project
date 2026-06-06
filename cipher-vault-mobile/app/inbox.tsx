import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Inbox, Trash2, ShieldAlert, KeyRound, Clock, ArrowRightLeft } from "lucide-react-native";

import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import AnimatedCard from "@/components/AnimatedCard";
import CustomSheet from "@/components/CustomSheet";

export default function InboxScreen() {
  const router = useRouter();
  const { colors } = useColorScheme();

  const [transfers, setTransfers] = useState<EphemeralTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  
  // Sheet state
  const [selectedTransfer, setSelectedTransfer] = useState<EphemeralTransfer | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  async function fetchTransfers(devId: string) {
    const { data, error } = await supabase
      .from("ephemeral_transfers")
      .select("*")
      .eq("device_id", devId)
      .order("created_at", { ascending: false });
    if (!error && data) setTransfers(data as EphemeralTransfer[]);
    setLoading(false);
  }

  useEffect(() => {
    getDeviceId().then((id) => {
      setDeviceId(id);
      if (id) fetchTransfers(id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    const channel = supabase
      .channel("inbox_realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ephemeral_transfers",
        filter: `device_id=eq.${deviceId}`,
      }, (payload) => {
        setTransfers((prev) => [payload.new as EphemeralTransfer, ...prev]);
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "ephemeral_transfers",
        filter: `device_id=eq.${deviceId}`,
      }, (payload) => {
        setTransfers((prev) => prev.filter((t) => t.id !== (payload.old as { id: string }).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [deviceId]);

  function openPayloadActions(transfer: EphemeralTransfer) {
    setSelectedTransfer(transfer);
    setSheetVisible(true);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  const sheetOptions = selectedTransfer
    ? [
        {
          label: "Decrypt Document",
          onPress: () => router.push({ pathname: "/decrypt", params: { transferId: selectedTransfer.id } }),
        },
        {
          label: "Delete from Server",
          destructive: true,
          onPress: () => {
            Alert.alert("Delete Payload", "Permanently delete this encrypted file?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete", style: "destructive",
                onPress: async () => {
                  await supabase.from("ephemeral_transfers").delete().eq("id", selectedTransfer.id);
                },
              },
            ]);
          },
        },
      ]
    : [];

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      {/* Glow */}
      <View
        className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-10"
        style={{
          backgroundColor: "#4f46e5",
          transform: [{ translateX: -100 }, { translateY: -100 }],
          shadowColor: "#4f46e5",
          shadowRadius: 100,
          shadowOpacity: 1,
          elevation: 25,
        }}
      />

      <Stack.Screen
        options={{
          title: "Secure Inbox",
          headerTransparent: true,
          headerBlurEffect: "dark",
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 gap-4">
          {loading ? (
            <View className="py-20">
              <ActivityIndicator color="#818cf8" size="large" />
            </View>
          ) : !deviceId ? (
            <AnimatedCard className="p-5 items-center justify-center">
              <ShieldAlert size={40} color="#f59e0b" className="mb-3" />
              <Text className="text-white text-base font-bold mb-2">Device Not Paired</Text>
              <Text className="text-slate-400 text-xs text-center mb-4">
                Please pair your device with the web interface to check your secure inbox.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/scan")}
                className="bg-indigo-600 rounded-xl px-5 py-3 active:bg-indigo-700"
              >
                <Text className="text-white font-bold text-xs">Pair Now</Text>
              </TouchableOpacity>
            </AnimatedCard>
          ) : transfers.length === 0 ? (
            <AnimatedCard className="p-8 items-center justify-center border border-slate-900 bg-slate-950/20">
              <Inbox size={48} color="#475569" className="mb-4" />
              <Text className="text-slate-300 text-base font-bold mb-1">Inbox Empty</Text>
              <Text className="text-slate-500 text-xs text-center leading-5">
                Upload or encrypt a file in your web portal and forward it to this device node to test decryption.
              </Text>
            </AnimatedCard>
          ) : (
            <View className="gap-3">
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Received Documents ({transfers.length})
              </Text>
              {transfers.map((transfer, index) => (
                <AnimatedCard
                  key={transfer.id}
                  delay={index * 80}
                  onPress={() => openPayloadActions(transfer)}
                  className="p-4 border border-[#1e1e2d] active:border-indigo-500/50"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white font-bold text-sm flex-1 mr-3" numberOfLines={1}>
                      {transfer.document_name || "Secure Package"}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Clock size={11} color="#64748b" />
                      <Text className="text-slate-500 text-[10px]">
                        {formatDate(transfer.created_at)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mb-3">
                    <View className="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800">
                      <Text className="text-slate-400 text-[9px] font-semibold font-mono">
                        AES-{transfer.aes_mode}
                      </Text>
                    </View>
                    <View className="px-2.5 py-0.5 rounded-full bg-indigo-500/5 border border-indigo-500/20">
                      <Text className="text-indigo-400 text-[9px] font-semibold font-mono">
                        RSA-WRAP
                      </Text>
                    </View>
                  </View>

                  <Text className="text-slate-500 text-[10px] font-mono mb-2 bg-slate-950/60 p-2 rounded-lg border border-slate-900/60" numberOfLines={2}>
                    {transfer.encrypted_payload}
                  </Text>

                  <View className="flex-row items-center justify-end gap-1 opacity-70">
                    <Text className="text-indigo-400 text-[9px] font-semibold">Options</Text>
                    <KeyRound size={10} color="#818cf8" />
                  </View>
                </AnimatedCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Bottom Sheet */}
      <CustomSheet
        visible={sheetVisible}
        title={selectedTransfer?.document_name || "Secure Payload Options"}
        options={sheetOptions}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}
