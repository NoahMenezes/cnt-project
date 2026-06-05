import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Inbox, Lock, Trash2, ChevronRight, RefreshCw } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import { getDeviceId } from "@/lib/secureStore";

export default function InboxScreen() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<EphemeralTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);

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

  // Real-time subscription
  useEffect(() => {
    if (!deviceId) return;
    const channel = supabase
      .channel("inbox_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ephemeral_transfers",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          setTransfers((prev) => [payload.new as EphemeralTransfer, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "ephemeral_transfers",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          setTransfers((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  async function handleDelete(id: string) {
    Alert.alert(
      "Delete Payload",
      "This will permanently delete this encrypted payload from the server.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase.from("ephemeral_transfers").delete().eq("id", id);
          },
        },
      ]
    );
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#0a0a0f] items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (!deviceId) {
    return (
      <View className="flex-1 bg-[#0a0a0f] items-center justify-center px-8">
        <Lock size={40} color="#6366f1" />
        <Text className="text-white text-base font-bold mt-4 mb-2 text-center">
          Device Not Paired
        </Text>
        <Text className="text-slate-500 text-sm text-center">
          Scan a QR code from the CipherVault web app to pair this device.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/scan")}
          className="mt-6 px-6 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30"
        >
          <Text className="text-indigo-400 font-semibold text-sm">
            Scan QR Code
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      {/* Blue glow */}
      <View
        className="absolute top-0 left-0 w-48 h-48 rounded-full opacity-10"
        style={{
          backgroundColor: "#6366f1",
          transform: [{ translateX: -60 }, { translateY: -60 }],
          shadowColor: "#6366f1",
          shadowRadius: 60,
          shadowOpacity: 1,
          elevation: 20,
        }}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Inbox size={16} color="#6366f1" />
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Secure Inbox
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchTransfers(deviceId!)}
            className="p-2 rounded-lg bg-[#111118] border border-[#1e1e2e]"
          >
            <RefreshCw size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {transfers.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Lock size={40} color="#1e1e2e" />
            <Text className="text-slate-600 text-sm mt-4 text-center">
              No encrypted payloads yet.{"\n"}
              Encrypt a document on the web app and send it here.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {transfers.map((transfer) => (
              <View
                key={transfer.id}
                className="rounded-2xl border border-[#1e1e2e] bg-[#111118] overflow-hidden"
              >
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/decrypt",
                      params: { transferId: transfer.id },
                    })
                  }
                  className="p-4 active:opacity-70"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-indigo-500/15 items-center justify-center">
                      <Lock size={18} color="#6366f1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-white mb-0.5" numberOfLines={1}>
                        {transfer.document_name || "Encrypted Payload"}
                      </Text>
                      <Text className="text-[11px] text-slate-600">
                        {formatDate(transfer.created_at)} · {transfer.aes_mode}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#475569" />
                  </View>
                </TouchableOpacity>
                {/* Cipher preview */}
                <View className="mx-4 mb-3 p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <Text
                    className="text-[10px] font-mono text-orange-400/60"
                    numberOfLines={2}
                  >
                    {transfer.encrypted_payload.substring(0, 80)}…
                  </Text>
                </View>
                {/* Delete button */}
                <TouchableOpacity
                  onPress={() => handleDelete(transfer.id)}
                  className="flex-row items-center justify-center gap-2 py-2.5 border-t border-[#1e1e2e] active:opacity-70"
                >
                  <Trash2 size={13} color="#ef4444" />
                  <Text className="text-[11px] font-semibold text-red-500">
                    Delete from Server
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
