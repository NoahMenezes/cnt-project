import { useActionSheet } from "@expo/react-native-action-sheet";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
} from "react-native";

import { useColorScheme } from "@/lib/useColorScheme";
import { getPrivateKey, savePrivateKey } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import { hybridDecrypt } from "@/lib/crypto";

export default function DecryptScreen() {
  const { transferId } = useLocalSearchParams<{ transferId?: string }>();
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();

  const [transfer, setTransfer] = useState<EphemeralTransfer | null>(null);
  const [loadingTransfer, setLoadingTransfer] = useState(!!transferId);
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);

  useEffect(() => {
    getPrivateKey().then((key) => {
      if (key) { setPrivateKey(key); setHasSavedKey(true); }
    });
  }, []);

  useEffect(() => {
    if (!transferId) return;
    supabase
      .from("ephemeral_transfers")
      .select("*")
      .eq("id", transferId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setTransfer(data as EphemeralTransfer);
        setLoadingTransfer(false);
      });
  }, [transferId]);

  async function handleDecrypt() {
    if (!privateKey.trim()) { setDecryptError("Paste your RSA Private Key to decrypt."); return; }
    if (!transfer) { setDecryptError("No payload loaded."); return; }
    setDecrypting(true);
    setDecryptError("");
    setDecryptedText("");
    await new Promise((r) => setTimeout(r, 400));
    const result = hybridDecrypt(transfer.encrypted_payload, transfer.encrypted_session_key, privateKey);
    if (result.success) setDecryptedText(result.plaintext);
    else setDecryptError(result.error ?? "Decryption failed.");
    setDecrypting(false);
  }

  async function handleSaveKey() {
    if (!privateKey.trim()) return;
    await savePrivateKey(privateKey.trim());
    setHasSavedKey(true);
    Alert.alert("✅ Saved", "RSA Private Key securely stored on this device.");
  }

  function openDecryptedActions() {
    const options = ["Copy to Clipboard", "Share", "Burn After Reading", "Cancel"];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 3;
    showActionSheetWithOptions(
      {
        options, cancelButtonIndex, destructiveButtonIndex,
        containerStyle: { backgroundColor: isDarkColorScheme ? "#0a0a14" : "#ffffff" },
        textStyle: { color: colors.foreground },
      },
      async (selectedIndex) => {
        if (selectedIndex === 0) {
          Clipboard.setString(decryptedText);
          Alert.alert("Copied", "Decrypted text copied to clipboard.");
        }
        if (selectedIndex === 1) await Share.share({ message: decryptedText });
        if (selectedIndex === destructiveButtonIndex && transfer) {
          Alert.alert("🔥 Burn After Reading", "Delete this payload from the server permanently?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete", style: "destructive",
              onPress: async () => {
                await supabase.from("ephemeral_transfers").delete().eq("id", transfer.id);
                router.replace("/inbox");
              },
            },
          ]);
        }
      }
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Decrypt Payload",
          headerLargeTitle: false,
          headerTransparent: true,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="p-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loadingTransfer ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <View className="gap-4">

            {/* Payload Info */}
            {transfer && (
              <View className="border-border bg-card gap-3 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
                  Encrypted Payload
                </Text>
                <Text className="text-foreground font-semibold text-sm text-center">
                  {transfer.document_name}
                </Text>
                <View className="flex-row justify-center gap-2">
                  <View className="px-2 py-0.5 rounded-full border border-border">
                    <Text className="text-muted-foreground text-[10px] font-mono">{transfer.aes_mode}</Text>
                  </View>
                  <View className="px-2 py-0.5 rounded-full border border-border">
                    <Text className="text-muted-foreground text-[10px] font-mono">RSA-WRAPPED</Text>
                  </View>
                </View>
                <Text className="text-muted-foreground text-[10px] font-mono" numberOfLines={3}>
                  {transfer.encrypted_payload.substring(0, 120)}…
                </Text>
              </View>
            )}

            {/* Private Key */}
            <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
              <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
                RSA Private Key
              </Text>

              {hasSavedKey ? (
                <View className="gap-3">
                  <Text className="text-muted-foreground text-xs text-center">
                    ✅ Private Key loaded from Secure Storage
                  </Text>
                  <TouchableOpacity
                    onPress={() => setHasSavedKey(false)}
                    className="border-border rounded-lg border px-4 py-2 items-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-muted-foreground text-sm">Update Key</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="gap-3">
                  <TextInput
                    value={privateKey}
                    onChangeText={setPrivateKey}
                    multiline
                    numberOfLines={5}
                    placeholder="-----BEGIN PRIVATE KEY-----"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showKey}
                    className="border-border w-full rounded-xl border p-3 font-mono text-[11px] text-foreground"
                    style={{ minHeight: 110, textAlignVertical: "top" }}
                  />
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setShowKey((v) => !v)}
                      className="border-border flex-1 rounded-lg border py-2 items-center"
                      activeOpacity={0.7}
                    >
                      <Text className="text-muted-foreground text-sm">
                        {showKey ? "Hide" : "Show"} Key
                      </Text>
                    </TouchableOpacity>
                    {privateKey.trim().length > 0 && (
                      <TouchableOpacity
                        onPress={handleSaveKey}
                        className="flex-1 bg-primary rounded-lg py-2 items-center"
                        activeOpacity={0.8}
                      >
                        <Text className="text-primary-foreground font-semibold text-sm">Save</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Decrypt Button */}
            {transfer && (
              <TouchableOpacity
                onPress={handleDecrypt}
                disabled={decrypting}
                className="bg-primary rounded-xl py-4 items-center"
                style={{ opacity: decrypting ? 0.6 : 1 }}
                activeOpacity={0.8}
              >
                {decrypting ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color={colors.primaryForeground} size="small" />
                    <Text className="text-primary-foreground font-bold text-sm">Decrypting…</Text>
                  </View>
                ) : (
                  <Text className="text-primary-foreground font-bold text-sm">Decrypt Payload</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Error */}
            {decryptError !== "" && (
              <View className="border-border bg-card rounded-xl border p-4 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-destructive text-xs text-center leading-5">{decryptError}</Text>
              </View>
            )}

            {/* Result */}
            {decryptedText !== "" && (
              <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
                  Decrypted Document
                </Text>
                <Text className="font-mono text-xs text-foreground leading-5">
                  {decryptedText}
                </Text>
                <TouchableOpacity
                  onPress={openDecryptedActions}
                  className="bg-primary rounded-lg py-3 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-primary-foreground font-semibold text-sm">Actions</Text>
                </TouchableOpacity>
              </View>
            )}

            {!transfer && (
              <View className="border-border bg-card rounded-xl border p-4 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-muted-foreground text-xs text-center leading-5">
                  Navigate to your Secure Inbox to select an encrypted payload to decrypt.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/inbox")}
                  className="mt-3 border-border rounded-lg border py-3 items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-foreground text-sm font-semibold">Open Inbox</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        )}
      </ScrollView>
    </>
  );
}
