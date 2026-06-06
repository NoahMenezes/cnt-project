import { useActionSheet } from "@expo/react-native-action-sheet";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";

export default function InboxScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();

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
    const options = ["Decrypt", "Delete from Server", "Cancel"];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: transfer.document_name || "Encrypted Payload",
        containerStyle: {
          backgroundColor: isDarkColorScheme ? "#0a0a14" : "#ffffff",
        },
        textStyle: { color: colors.foreground },
        titleTextStyle: { color: colors.mutedForeground },
      },
      async (selectedIndex) => {
        if (selectedIndex === 0) {
          router.push({ pathname: "/decrypt", params: { transferId: transfer.id } });
        }
        if (selectedIndex === destructiveButtonIndex) {
          Alert.alert("Delete Payload", "Permanently delete this from the server?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete", style: "destructive",
              onPress: () => supabase.from("ephemeral_transfers").delete().eq("id", transfer.id),
            },
          ]);
        }
      }
    );
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Secure Inbox",
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
        ) : !deviceId ? (
          <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
            <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
              Not Paired
            </Text>
            <Text className="text-muted-foreground text-xs text-center">
              Scan a QR code from the CipherVault web app to pair this device.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/scan")}
              className="bg-primary rounded-lg py-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-primary-foreground font-semibold text-sm">
                Scan QR Code
              </Text>
            </TouchableOpacity>
          </View>
        ) : transfers.length === 0 ? (
          <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
            <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
              Inbox Empty
            </Text>
            <Text className="text-muted-foreground text-xs text-center">
              No encrypted payloads yet.{"\n"}Encrypt a document on the web app and send it here.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {transfers.map((transfer) => (
              <TouchableOpacity
                key={transfer.id}
                onPress={() => openPayloadActions(transfer)}
                activeOpacity={0.7}
              >
                <View className="border-border bg-card gap-3 rounded-xl border p-4 shadow-sm shadow-black/10 dark:shadow-none">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
                      {transfer.document_name || "Encrypted Payload"}
                    </Text>
                    <Text className="text-muted-foreground text-[10px]">
                      {formatDate(transfer.created_at)}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <View className="px-2 py-0.5 rounded-full border border-border">
                      <Text className="text-muted-foreground text-[10px] font-mono">
                        {transfer.aes_mode}
                      </Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full border border-border">
                      <Text className="text-muted-foreground text-[10px] font-mono">
                        RSA-WRAPPED
                      </Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground text-[10px] font-mono" numberOfLines={2}>
                    {transfer.encrypted_payload.substring(0, 80)}…
                  </Text>
                  <Text className="text-muted-foreground text-[10px] text-right opacity-60">
                    Tap to view actions
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
