import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Inbox, Trash2, ShieldAlert, KeyRound, Clock } from "lucide-react-native";

import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import CustomSheet from "@/components/CustomSheet";
import AnimatedBackground from "@/components/AnimatedBackground";

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
        const newTransfer = payload.new as EphemeralTransfer;
        setTransfers((prev) => [newTransfer, ...prev]);
        Alert.alert(
          "New Transfer Received",
          `Encrypted document "${newTransfer.document_name || "Secure Package"}" received in your inbox.`
        );
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
    <View className="flex-1" style={{ overflow: "hidden" }}>
      <AnimatedBackground />
      <Stack.Screen
        options={{
          title: "Secure Inbox",
          headerLargeTitle: true,
          headerTransparent: true,
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="p-4 bg-transparent"
        contentContainerStyle={{ paddingTop: 140, paddingBottom: 60, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-md gap-4">
          {loading ? (
            <View className="border-border bg-card rounded-xl border p-8 items-center justify-center shadow-sm shadow-black/10 dark:shadow-none">
              <ActivityIndicator size="large" />
              <Text className="text-foreground text-sm font-medium tracking-wider opacity-60 mt-3">
                Fetching Inbox...
              </Text>
            </View>
          ) : !deviceId ? (
            <View className="border-border bg-card gap-4 rounded-xl border p-5 pb-6 items-center justify-center shadow-sm shadow-black/10 dark:shadow-none">
              <ShieldAlert size={40} color="#f59e0b" className="mb-1" />
              <Text className="text-foreground text-base font-bold">Device Not Paired</Text>
              <Text className="text-foreground opacity-60 text-xs text-center leading-5 mb-2">
                Please pair your device with the web interface to check your secure inbox.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/scan")}
                className="bg-primary rounded-xl px-5 py-3 active:opacity-85 w-full items-center"
              >
                <Text className="text-white font-bold text-xs">Pair Now</Text>
              </TouchableOpacity>
            </View>
          ) : transfers.length === 0 ? (
            <View className="border-border bg-card gap-4 rounded-xl border p-6 py-8 items-center justify-center shadow-sm shadow-black/10 dark:shadow-none">
              <Inbox size={48} color="#64748b" className="mb-1" />
              <Text className="text-foreground text-base font-bold">Inbox Empty</Text>
              <Text className="text-foreground opacity-60 text-xs text-center leading-5">
                Upload or encrypt a file in your web portal and forward it to this device node to test decryption.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              <Text className="text-foreground opacity-60 text-xs font-semibold uppercase tracking-wider mb-1">
                Received Documents ({transfers.length})
              </Text>
              {transfers.map((transfer) => (
                <TouchableOpacity
                  key={transfer.id}
                  onPress={() => openPayloadActions(transfer)}
                  activeOpacity={0.8}
                  className="border-border bg-card gap-3.5 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none active:opacity-90"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground font-bold text-sm flex-1 mr-3" numberOfLines={1}>
                      {transfer.document_name || "Secure Package"}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Clock size={11} color="#64748b" />
                      <Text className="text-foreground opacity-60 text-[10px]">
                        {formatDate(transfer.created_at)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="px-2.5 py-0.5 rounded-full bg-background border border-border">
                      <Text className="text-foreground opacity-70 text-[9px] font-semibold font-mono">
                        AES-{transfer.aes_mode}
                      </Text>
                    </View>
                    <View className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      <Text className="text-primary text-[9px] font-semibold font-mono">
                        RSA-WRAP
                      </Text>
                    </View>
                  </View>

                  <Text className="text-foreground opacity-60 text-[10px] font-mono bg-background p-2.5 rounded-xl border border-border" numberOfLines={2}>
                    {transfer.encrypted_payload}
                  </Text>

                  <View className="flex-row items-center justify-end gap-1 opacity-70">
                    <Text className="text-primary text-[9px] font-semibold">Options</Text>
                    <KeyRound size={10} color={colors.primary} />
                  </View>
                </TouchableOpacity>
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
