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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Key, Eye, EyeOff, Unlock, CheckCircle, Copy, Download, Trash2 } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import { getPrivateKey, savePrivateKey } from "@/lib/secureStore";
import { hybridDecrypt } from "@/lib/crypto";

export default function DecryptScreen() {
  const { transferId } = useLocalSearchParams<{ transferId?: string }>();
  const router = useRouter();

  const [transfer, setTransfer] = useState<EphemeralTransfer | null>(null);
  const [loadingTransfer, setLoadingTransfer] = useState(!!transferId);
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [keyImportMode, setKeyImportMode] = useState(false);

  useEffect(() => {
    getPrivateKey().then((key) => {
      if (key) {
        setPrivateKey(key);
        setHasSavedKey(true);
      }
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
    if (!privateKey.trim()) {
      setDecryptError("Paste your RSA Private Key to decrypt.");
      return;
    }
    if (!transfer) {
      setDecryptError("No payload loaded.");
      return;
    }
    setDecrypting(true);
    setDecryptError("");
    setDecryptedText("");
    await new Promise((r) => setTimeout(r, 600));
    const result = hybridDecrypt(
      transfer.encrypted_payload,
      transfer.encrypted_session_key,
      privateKey
    );
    if (result.success) {
      setDecryptedText(result.plaintext);
    } else {
      setDecryptError(result.error ?? "Decryption failed.");
    }
    setDecrypting(false);
  }

  async function handleSaveKey() {
    if (!privateKey.trim()) return;
    await savePrivateKey(privateKey.trim());
    setHasSavedKey(true);
    setKeyImportMode(false);
    Alert.alert("✅ Saved", "RSA Private Key securely stored on this device.");
  }

  async function handleCopy() {
    Clipboard.setString(decryptedText);
    Alert.alert("Copied", "Decrypted text copied to clipboard.");
  }

  async function handleShare() {
    await Share.share({ message: decryptedText });
  }

  async function handleBurnAfterReading() {
    if (!transfer) return;
    Alert.alert(
      "🔥 Burn After Reading",
      "Delete this payload from the server permanently?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase.from("ephemeral_transfers").delete().eq("id", transfer.id);
            router.replace("/inbox");
          },
        },
      ]
    );
  }

  if (loadingTransfer) {
    return (
      <View className="flex-1 bg-[#0a0a0f] items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <View
        className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-15"
        style={{
          backgroundColor: "#6366f1",
          transform: [{ translateX: 70 }, { translateY: -70 }],
          shadowColor: "#6366f1",
          shadowRadius: 70,
          shadowOpacity: 1,
          elevation: 20,
        }}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Payload Info */}
        {transfer && (
          <View className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 mb-4">
            <Text className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">
              Encrypted Payload
            </Text>
            <Text className="text-sm font-semibold text-white mb-1">
              {transfer.document_name}
            </Text>
            <View className="flex-row gap-3 mt-1">
              <View className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Text className="text-[10px] font-mono text-orange-400">
                  AES-{transfer.aes_mode}
                </Text>
              </View>
              <View className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Text className="text-[10px] font-mono text-blue-400">RSA-WRAPPED</Text>
              </View>
            </View>
            <View className="mt-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <Text className="text-[10px] font-mono text-orange-400/60" numberOfLines={3}>
                {transfer.encrypted_payload.substring(0, 120)}…
              </Text>
            </View>
          </View>
        )}

        {/* Private Key Input */}
        <View className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Key size={15} color="#6366f1" />
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                RSA Private Key
              </Text>
            </View>
            {hasSavedKey && !keyImportMode && (
              <TouchableOpacity
                onPress={() => setKeyImportMode(true)}
                className="px-2 py-1 rounded-lg bg-indigo-500/10"
              >
                <Text className="text-[11px] text-indigo-400 font-semibold">Update Key</Text>
              </TouchableOpacity>
            )}
          </View>

          {hasSavedKey && !keyImportMode ? (
            <View className="flex-row items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={16} color="#10b981" />
              <Text className="text-xs text-emerald-400 font-semibold">
                Private Key loaded from Secure Storage
              </Text>
            </View>
          ) : (
            <>
              <View className="relative">
                <TextInput
                  value={privateKey}
                  onChangeText={setPrivateKey}
                  multiline
                  numberOfLines={5}
                  placeholder="-----BEGIN PRIVATE KEY-----"
                  placeholderTextColor="#334155"
                  secureTextEntry={!showKey}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-3 font-mono text-[11px] text-orange-400"
                  style={{ minHeight: 120, textAlignVertical: "top" }}
                />
                <TouchableOpacity
                  onPress={() => setShowKey((v) => !v)}
                  className="absolute top-3 right-3"
                >
                  {showKey ? (
                    <EyeOff size={16} color="#475569" />
                  ) : (
                    <Eye size={16} color="#475569" />
                  )}
                </TouchableOpacity>
              </View>
              {privateKey.trim().length > 0 && (
                <TouchableOpacity
                  onPress={handleSaveKey}
                  className="mt-2 py-2 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 items-center"
                >
                  <Text className="text-indigo-400 text-xs font-semibold">
                    Save to Secure Storage
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Decrypt Button */}
        {transfer && (
          <TouchableOpacity
            onPress={handleDecrypt}
            disabled={decrypting}
            className="rounded-2xl bg-indigo-500 p-4 items-center mb-4 active:opacity-80"
            style={{ opacity: decrypting ? 0.6 : 1 }}
          >
            {decrypting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold text-sm">Decrypting…</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <Unlock size={18} color="white" />
                <Text className="text-white font-bold text-sm">Decrypt Payload</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Error */}
        {decryptError !== "" && (
          <View className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-4">
            <Text className="text-red-400 text-xs leading-5">{decryptError}</Text>
          </View>
        )}

        {/* Result */}
        {decryptedText !== "" && (
          <View className="rounded-2xl border border-emerald-500/30 bg-[#111118] p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <CheckCircle size={16} color="#10b981" />
              <Text className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Decrypted Document
              </Text>
            </View>
            <View className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-3">
              <Text className="font-mono text-xs text-slate-300 leading-5">
                {decryptedText}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleCopy}
                className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 border border-[#1e1e2e]"
              >
                <Copy size={13} color="#94a3b8" />
                <Text className="text-slate-400 text-xs font-semibold">Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 border border-[#1e1e2e]"
              >
                <Download size={13} color="#94a3b8" />
                <Text className="text-slate-400 text-xs font-semibold">Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBurnAfterReading}
                className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <Trash2 size={13} color="#ef4444" />
                <Text className="text-red-400 text-xs font-semibold">Burn</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!transfer && (
          <View className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4">
            <Text className="text-xs text-slate-500 text-center leading-5">
              Navigate to your Secure Inbox to select an encrypted payload to decrypt.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/inbox")}
              className="mt-3 py-2.5 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 items-center"
            >
              <Text className="text-indigo-400 text-sm font-semibold">Open Inbox</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
