import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Share } from "react-native";
import { KeyRound, Eye, EyeOff, ShieldCheck, Download, Lock } from "lucide-react-native";
import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import { extractRSAPrivateNumbers, rsaDecryptString, aesDecryptSim, hybridDecrypt } from "@/lib/crypto";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function DecryptScreen() {
  const { transferId, rawTransferStr } = useLocalSearchParams<{ transferId?: string; rawTransferStr?: string }>();
  const router = useRouter();
  const { colors } = useColorScheme();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!transferId || !!rawTransferStr);
  const [transfer, setTransfer] = useState<EphemeralTransfer | null>(null);
  const [privateKey, setPrivateKey] = useState("");
  const [esKey, setEsKey] = useState("");
  const [encryptedPayload, setEncryptedPayload] = useState("");
  const [aesKey, setAesKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [decryptError, setDecryptError] = useState("");

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    if (!transferId) return;
    supabase
      .from("ephemeral_transfers")
      .select("*")
      .eq("id", transferId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const tr = data as EphemeralTransfer;
          setTransfer(tr);
          setEncryptedPayload(tr.encrypted_payload || "");
          setEsKey(tr.encrypted_session_key || "");
        }
        setLoading(false);
      });
  }, [transferId]);

  useEffect(() => {
    if (!rawTransferStr) return;
    try {
      const data = JSON.parse(rawTransferStr) as EphemeralTransfer;
      setTransfer(data);
      setEncryptedPayload(data.encrypted_payload || "");
      setEsKey(data.encrypted_session_key || "");
    } catch { /* ignore */ }
    setLoading(false);
  }, [rawTransferStr]);

  const handleDecrypt = async () => {
    if (!privateKey.trim() && !aesKey.trim()) {
      Alert.alert("Input Required", "Paste your RSA Private Key or AES Key to decrypt.");
      return;
    }
    setDecrypting(true);
    setDecryptError("");
    setDecryptedText("");

    await new Promise((r) => setTimeout(r, 400));

    try {
      let plaintext = "";
      if (privateKey.trim()) {
        const result = hybridDecrypt(encryptedPayload, esKey, privateKey.trim());
        if (!result.success) throw new Error(result.error || "Decryption failed.");
        plaintext = result.plaintext;
        const parsed = extractRSAPrivateNumbers(privateKey.trim());
        if (parsed && esKey) {
          const unwrapped = rsaDecryptString(esKey, parsed.d, parsed.n);
          if (unwrapped) setAesKey(unwrapped.trim());
        }
      } else if (aesKey.trim()) {
        plaintext = aesDecryptSim(encryptedPayload, aesKey.trim());
      }

      if (plaintext?.trim()) {
        setDecryptedText(plaintext);
        if (transfer?.id) {
          supabase.from("ephemeral_transfers").delete().eq("id", transfer.id).then(() => {});
        }
      } else {
        setDecryptError("Decryption yielded empty text. Verify your keys.");
      }
    } catch (err) {
      setDecryptError(err instanceof Error ? err.message : "Decryption failed.");
    } finally {
      setDecrypting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <AnimatedBackground />
        <ActivityIndicator size="large" />
        <Text className="text-foreground text-sm mt-4 opacity-60">Loading encrypted payload...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <AnimatedBackground />
      <Stack.Screen options={{ title: "Decrypt Payload", headerLargeTitle: true, headerTransparent: true }} />
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingTop: 120, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-md mx-auto gap-5">
          <View className="border-border bg-card rounded-2xl border p-5 items-center shadow-sm">
            <Lock size={36} color={colors.primary} />
            <Text className="text-foreground text-lg font-bold mt-3">Decrypt Payload</Text>
            <Text className="text-foreground opacity-60 text-xs text-center mt-1">
              {transfer?.document_name || "Encrypted Document"}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">Step 1: RSA Private Key</Text>
            <TextInput
              className="border-border bg-card text-foreground rounded-xl border p-3 text-xs font-mono min-h-[80px]"
              multiline
              placeholder="Paste your RSA Private Key PEM here..."
              placeholderTextColor="#64748b"
              value={privateKey}
              onChangeText={setPrivateKey}
              secureTextEntry={!showKey}
            />
            <TouchableOpacity onPress={() => setShowKey(!showKey)} className="flex-row items-center gap-1.5 py-1">
              {showKey ? <EyeOff size={14} color="#64748b" /> : <Eye size={14} color="#64748b" />}
              <Text className="text-foreground opacity-60 text-xs">{showKey ? "Hide" : "Show"} Key</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">Step 2: Encrypted Session Key</Text>
            <TextInput
              className="border-border bg-card text-foreground rounded-xl border p-3 text-xs font-mono"
              multiline
              placeholder="Paste encrypted session key..."
              placeholderTextColor="#64748b"
              value={esKey}
              onChangeText={setEsKey}
            />
          </View>

          <View className="gap-2">
            <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">Step 3: Encrypted Payload</Text>
            <TextInput
              className="border-border bg-card text-foreground rounded-xl border p-3 text-xs font-mono min-h-[80px]"
              multiline
              placeholder="Paste encrypted payload..."
              placeholderTextColor="#64748b"
              value={encryptedPayload}
              onChangeText={setEncryptedPayload}
            />
          </View>

          <TouchableOpacity
            onPress={handleDecrypt}
            disabled={decrypting || (!privateKey.trim() && !aesKey.trim())}
            className="bg-primary rounded-xl py-4 items-center active:opacity-85"
            style={{ opacity: decrypting ? 0.6 : 1 }}
          >
            {decrypting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-primary-foreground font-bold text-sm">Decrypt Document</Text>
            )}
          </TouchableOpacity>

          {decryptError !== "" && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <Text className="text-red-400 text-xs">{decryptError}</Text>
            </View>
          )}

          {decryptedText !== "" && (
            <View className="border-border bg-card rounded-2xl border p-4 gap-3">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={18} color="#10b981" />
                <Text className="text-emerald-400 font-bold text-sm">Decrypted Successfully</Text>
              </View>
              <Text className="text-foreground text-xs font-mono leading-5 max-h-60 border border-border bg-background rounded-xl p-3">
                {decryptedText}
              </Text>
              <TouchableOpacity
                onPress={() => Share.share({ message: decryptedText, title: "Decrypted Document" })}
                className="border-border rounded-xl border py-3 items-center flex-row justify-center gap-2"
              >
                <Download size={16} color={colors.primary} />
                <Text className="text-primary font-semibold text-xs">Share Document</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={() => router.back()} className="py-3 items-center">
            <Text className="text-foreground opacity-50 text-xs">Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
