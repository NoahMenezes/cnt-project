import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Share, Clipboard } from "react-native";
import { KeyRound, Eye, EyeOff, ShieldCheck, Download, Trash2, ArrowLeft } from "lucide-react-native";

import { useColorScheme } from "@/lib/useColorScheme";
import { getPrivateKey, savePrivateKey } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import { hybridDecrypt } from "@/lib/crypto";
import AnimatedCard from "@/components/AnimatedCard";
import CustomSheet from "@/components/CustomSheet";

export default function DecryptScreen() {
  const { transferId, rawTransferStr } = useLocalSearchParams<{ transferId?: string, rawTransferStr?: string }>();
  const router = useRouter();
  const { colors } = useColorScheme();

  const [transfer, setTransfer] = useState<EphemeralTransfer | null>(null);
  const [loadingTransfer, setLoadingTransfer] = useState(!!transferId || !!rawTransferStr);
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [decryptedFileBase64, setDecryptedFileBase64] = useState("");
  const [decryptedFileName, setDecryptedFileName] = useState("Decrypted Document");
  const [decryptError, setDecryptError] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  
  // Sheet state
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    getPrivateKey().then((key) => {
      if (key) {
        setPrivateKey(key);
        setHasSavedKey(true);
      }
    });
  }, []);

  const parseKeysFromTransfer = (tr: EphemeralTransfer) => {
    try {
      if (tr.encrypted_session_key && tr.encrypted_session_key.trim().startsWith("{")) {
        const keysObj = JSON.parse(tr.encrypted_session_key);
        if (keysObj.rsa_private_key) {
          setPrivateKey(keysObj.rsa_private_key);
          setHasSavedKey(true);
          savePrivateKey(keysObj.rsa_private_key);
        }
        // Extract the actual wrapped session key for hybrid decryption
        tr.encrypted_session_key = keysObj.encrypted_session_key || "";
      }
    } catch (e) {
      // Not JSON
    }
    return tr;
  };

  useEffect(() => {
    if (rawTransferStr) {
      try {
        const data = JSON.parse(rawTransferStr);
        const tr = parseKeysFromTransfer(data as EphemeralTransfer);
        setTransfer(tr);
        setLoadingTransfer(false);
      } catch (e) {
        setDecryptError("Invalid raw payload");
        setLoadingTransfer(false);
      }
      return;
    }

    if (!transferId) return;
    supabase
      .from("ephemeral_transfers")
      .select("*")
      .eq("id", transferId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const tr = parseKeysFromTransfer(data as EphemeralTransfer);
          setTransfer(tr);
        }
        setLoadingTransfer(false);
      });
  }, [transferId, rawTransferStr]);

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
    setDecryptedFileBase64("");
    await new Promise((r) => setTimeout(r, 600));
    const result = hybridDecrypt(
      transfer.encrypted_payload,
      transfer.encrypted_session_key,
      privateKey
    );
    if (result.success) {
      let dispText = result.plaintext;
      let b64 = "";
      let fName = "Decrypted Document";

      try {
        if (result.plaintext.trim().startsWith("{")) {
          const parsed = JSON.parse(result.plaintext);
          if (parsed.type === "file_package") {
            dispText = parsed.plaintext;
            b64 = parsed.fileBase64;
            fName = parsed.fileName || fName;
          }
        }
      } catch (e) {
        // Not a JSON file package
      }

      setDecryptedText(dispText);
      setDecryptedFileBase64(b64);
      setDecryptedFileName(fName);
    } else {
      setDecryptError(result.error ?? "Decryption failed.");
    }
    setDecrypting(false);
  }

  async function handleSaveKey() {
    if (!privateKey.trim()) return;
    await savePrivateKey(privateKey.trim());
    setHasSavedKey(true);
    Alert.alert("✅ Key Saved", "RSA Private Key securely stored inside device enclave.");
  }

  const handleDownloadFile = () => {
    if (!decryptedFileBase64) return;
    try {
      // Standard browser download link for mobile browsers/web
      const link = document.createElement("a");
      link.href = decryptedFileBase64;
      link.download = decryptedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert("Success", `Downloaded ${decryptedFileName} successfully.`);
    } catch (err) {
      // Sharing fallback for native devices
      Share.share({
        url: decryptedFileBase64,
        title: decryptedFileName,
        message: `Decrypted document: ${decryptedFileName}`
      });
    }
  };

  const resultOptions = [
    {
      label: "Copy to Clipboard",
      onPress: () => {
        Clipboard.setString(decryptedText);
        Alert.alert("Copied", "Decrypted text copied to clipboard.");
      },
    },
    {
      label: "Share via System Sheet",
      onPress: async () => {
        await Share.share({ message: decryptedText });
      },
    },
    {
      label: "Burn (Delete from Server)",
      destructive: true,
      onPress: () => {
        if (!transfer) return;
        Alert.alert(
          "🔥 Burn After Reading",
          "This will delete the encrypted payload from the server forever.",
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
      },
    },
  ];

  return (
    <View className="flex-1 bg-[#0a0a0f]" style={{ overflow: "hidden" }}>
      {/* Background radial glow */}
      <View
        className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
        style={{
          backgroundColor: "#818cf8",
          transform: [{ translateX: 80 }, { translateY: -80 }],
          shadowColor: "#818cf8",
          shadowRadius: 80,
          shadowOpacity: 1,
          elevation: 20,
        }}
      />

      <Stack.Screen
        options={{
          title: "Decryption Node",
          headerTransparent: true,
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-md px-6 gap-5">
          {loadingTransfer ? (
            <ActivityIndicator color="#818cf8" size="large" />
          ) : (
            <View className="gap-4">
              
              {/* Document Overview */}
              {transfer && (
                <AnimatedCard delay={50} className="p-4 border border-slate-900 bg-slate-950/20">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Source Package
                  </Text>
                  <Text className="text-white text-base font-bold mb-1">
                    {transfer.document_name}
                  </Text>
                  <View className="flex-row gap-2 mt-1">
                    <View className="px-2.5 py-0.5 rounded-full bg-slate-950/60 border border-slate-900">
                      <Text className="text-slate-400 text-[9px] font-semibold font-mono">
                        AES-{transfer.aes_mode}
                      </Text>
                    </View>
                    <View className="px-2.5 py-0.5 rounded-full bg-slate-950/60 border border-slate-900">
                      <Text className="text-slate-400 text-[9px] font-semibold font-mono">
                        RSA-WRAP
                      </Text>
                    </View>
                  </View>
                </AnimatedCard>
              )}

              {/* RSA Configuration Card */}
              <AnimatedCard delay={150} className="p-5">
                <View className="flex-row items-center justify-between mb-4 border-b border-slate-900 pb-3">
                  <View className="flex-row items-center gap-2">
                    <KeyRound size={16} color="#818cf8" />
                    <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      RSA Private Key
                    </Text>
                  </View>
                  {hasSavedKey && (
                    <TouchableOpacity
                      onPress={() => setHasSavedKey(false)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
                    >
                      <Text className="text-indigo-400 text-[10px] font-bold">Replace Key</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {hasSavedKey ? (
                  <View className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex-row items-center gap-3">
                    <ShieldCheck size={20} color="#10b981" />
                    <View className="flex-1">
                      <Text className="text-emerald-400 text-xs font-semibold">
                        Key Authenticated
                      </Text>
                      <Text className="text-slate-500 text-[10px]">
                        Secure hardware store loading enabled.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="gap-3">
                    <View className="relative">
                      <TextInput
                        value={privateKey}
                        onChangeText={setPrivateKey}
                        multiline
                        numberOfLines={5}
                        placeholder="-----BEGIN RSA PRIVATE KEY-----"
                        placeholderTextColor="#475569"
                        secureTextEntry={!showKey}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[10px] text-indigo-400"
                        style={{ minHeight: 110, textAlignVertical: "top" }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowKey((v) => !v)}
                        className="absolute top-3 right-3"
                      >
                        {showKey ? (
                          <EyeOff size={14} color="#64748b" />
                        ) : (
                          <Eye size={14} color="#64748b" />
                        )}
                      </TouchableOpacity>
                    </View>
                    {privateKey.trim().length > 0 && (
                      <TouchableOpacity
                        onPress={handleSaveKey}
                        className="bg-indigo-600/10 border border-indigo-600/30 rounded-xl py-2.5 items-center justify-center active:bg-indigo-600/20"
                      >
                        <Text className="text-indigo-400 text-xs font-bold">Save Key for Auto-Load</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </AnimatedCard>

              {/* Decrypt Trigger */}
              {transfer && (
                <TouchableOpacity
                  onPress={handleDecrypt}
                  disabled={decrypting}
                  className="bg-indigo-600 rounded-xl py-3.5 items-center justify-center active:bg-indigo-700 shadow-lg shadow-indigo-600/30"
                  style={{ opacity: decrypting ? 0.6 : 1 }}
                >
                  {decrypting ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-bold text-sm">Decrypting Payload…</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-bold text-sm">Decrypt Document</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Errors container */}
              {decryptError !== "" && (
                <AnimatedCard className="p-4 border-red-500/20 bg-red-500/5">
                  <Text className="text-red-400 text-xs text-center font-semibold leading-5">
                    {decryptError}
                  </Text>
                </AnimatedCard>
              )}

              {/* Decrypted Output Container */}
              {decryptedText !== "" && (
                <AnimatedCard delay={100} className="p-5 border-emerald-500/20 bg-emerald-500/5">
                  <View className="flex-row items-center gap-2 mb-3">
                    <ShieldCheck size={16} color="#10b981" />
                    <Text className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                      Decrypted Output
                    </Text>
                  </View>

                  {decryptedFileBase64 ? (
                    <View className="mb-4 bg-slate-950 p-4 rounded-xl border border-slate-900/60 items-center justify-center gap-3">
                      <View className="w-12 h-12 rounded-full bg-emerald-500/10 items-center justify-center border border-emerald-500/20">
                        <Download size={20} color="#10b981" />
                      </View>
                      <View className="items-center">
                        <Text className="text-white font-semibold text-xs text-center px-2" numberOfLines={1}>
                          {decryptedFileName}
                        </Text>
                        <Text className="text-slate-500 text-[10px] mt-0.5">
                          Original binary payload restored
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleDownloadFile}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4 py-2.5 w-full items-center justify-center active:bg-emerald-850 flex-row gap-1.5"
                      >
                        <Download size={14} color="#fff" />
                        <Text className="text-white font-bold text-xs">Save File to Device</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Plaintext Transcript
                  </Text>
                  <Text className="text-slate-300 font-mono text-xs mb-4 bg-slate-950 p-3.5 rounded-xl border border-slate-900/60 leading-5">
                    {decryptedText}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSheetVisible(true)}
                    className="bg-[#151520] border border-slate-900 rounded-xl py-3 items-center justify-center active:bg-[#1e1e2d]"
                  >
                    <Text className="text-slate-300 font-bold text-xs">Manage Payload</Text>
                  </TouchableOpacity>
                </AnimatedCard>
              )}

              {!transfer && (
                <AnimatedCard className="p-6 items-center justify-center border border-slate-900 bg-slate-950/20">
                  <Text className="text-slate-400 text-xs text-center leading-5 mb-4">
                    Open your secure inbox to load an encrypted transfer document into the decryptor module.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/inbox")}
                    className="bg-indigo-600 rounded-xl px-5 py-3 active:bg-indigo-700"
                  >
                    <Text className="text-white font-bold text-xs">Go to Inbox</Text>
                  </TouchableOpacity>
                </AnimatedCard>
              )}

            </View>
          )}
        </View>
      </ScrollView>

      {/* Share / Save Actions Menu */}
      <CustomSheet
        visible={sheetVisible}
        title="Decrypted Document Options"
        options={resultOptions}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}
