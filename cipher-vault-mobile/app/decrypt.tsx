import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Share, Clipboard } from "react-native";
import { KeyRound, Eye, EyeOff, ShieldCheck, Download, Trash2 } from "lucide-react-native";

import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { useColorScheme } from "@/lib/useColorScheme";
import { getPrivateKey, savePrivateKey } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import { hybridDecrypt } from "@/lib/crypto";
import CustomSheet from "@/components/CustomSheet";

export default function DecryptScreen() {
  const { transferId, rawTransferStr } = useLocalSearchParams<{ transferId?: string, rawTransferStr?: string }>();
  const router = useRouter();
  const { colors } = useColorScheme();

  const [transfer, setTransfer] = useState<EphemeralTransfer | null>(null);
  const [loadingTransfer, setLoadingTransfer] = useState(!!transferId || !!rawTransferStr);
  
  // Decryption Keys Input & States
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [decryptedFileBase64, setDecryptedFileBase64] = useState("");
  const [decryptedFileName, setDecryptedFileName] = useState("Decrypted Document");
  const [decryptError, setDecryptError] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);

  // Extracted Keys for Display (Uploaded with document)
  const [extractedPrivateKey, setExtractedPrivateKey] = useState("");
  const [extractedPublicKey, setExtractedPublicKey] = useState("");
  const [extractedAESKey, setExtractedAESKey] = useState("");
  
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
          setExtractedPrivateKey(keysObj.rsa_private_key);
        }
        if (keysObj.rsa_public_key) {
          setExtractedPublicKey(keysObj.rsa_public_key);
        }
        if (keysObj.aes_key) {
          setExtractedAESKey(keysObj.aes_key);
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
      label: "Copy Plaintext to Clipboard",
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
    <View className="flex-1 bg-background" style={{ overflow: "hidden" }}>
      <Stack.Screen
        options={{
          title: "Decryption Node",
          headerLargeTitle: true,
          headerTransparent: true,
        }}
      />

      <ScrollView 
        contentInsetAdjustmentBehavior="automatic" 
        className="p-4"
        contentContainerStyle={{ paddingTop: 140, paddingBottom: 60, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-md gap-4">
          
          {loadingTransfer ? (
            <View className="border-border bg-card rounded-xl border p-8 items-center justify-center shadow-sm shadow-black/10 dark:shadow-none">
              <ActivityIndicator size="large" />
              <Text className="text-foreground text-sm font-medium tracking-wider opacity-60 mt-3">
                Loading Transfer...
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              
              {/* Document Overview */}
              {transfer && (
                <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none">
                  <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                    Source Package Info
                  </Text>
                  <View className="gap-1.5">
                    <Text className="text-foreground text-base font-bold">
                      {transfer.document_name}
                    </Text>
                    <View className="flex-row gap-2 mt-1">
                      <View className="px-2.5 py-0.5 rounded-full bg-background border border-border">
                        <Text className="text-foreground opacity-70 text-[9px] font-semibold font-mono">
                          AES-{transfer.aes_mode}
                        </Text>
                      </View>
                      <View className="px-2.5 py-0.5 rounded-full bg-background border border-border">
                        <Text className="text-foreground opacity-70 text-[9px] font-semibold font-mono">
                          RSA-WRAP
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Display Extracted Transmission Keys */}
              {transfer && (extractedPrivateKey || extractedPublicKey || extractedAESKey) && (
                <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none">
                  <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                    Transmission Keys Enclave
                  </Text>

                  {extractedAESKey ? (
                    <View className="gap-1.5">
                      <Text className="text-foreground text-xs font-medium opacity-80">AES Session Key</Text>
                      <View className="flex-row gap-2 items-center bg-background border border-border rounded-xl p-2.5">
                        <Text className="text-foreground font-mono text-[10px] flex-1" numberOfLines={1}>
                          {extractedAESKey}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            Clipboard.setString(extractedAESKey);
                            Alert.alert("Copied", "AES Session Key copied to clipboard.");
                          }}
                          className="bg-primary/10 px-3 py-1.5 rounded-lg active:opacity-75"
                        >
                          <Text className="text-primary text-[10px] font-bold">Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  {extractedPublicKey ? (
                    <View className="gap-1.5">
                      <Text className="text-foreground text-xs font-medium opacity-80">RSA Public Key</Text>
                      <View className="flex-row gap-2 items-center bg-background border border-border rounded-xl p-2.5">
                        <Text className="text-foreground font-mono text-[10px] flex-1" numberOfLines={1}>
                          {extractedPublicKey}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            Clipboard.setString(extractedPublicKey);
                            Alert.alert("Copied", "RSA Public Key copied to clipboard.");
                          }}
                          className="bg-primary/10 px-3 py-1.5 rounded-lg active:opacity-75"
                        >
                          <Text className="text-primary text-[10px] font-bold">Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  {extractedPrivateKey ? (
                    <View className="gap-1.5">
                      <Text className="text-foreground text-xs font-medium opacity-80">RSA Private Key</Text>
                      <View className="bg-background border border-border rounded-xl p-3 gap-2.5">
                        <Text className="text-foreground font-mono text-[9px] opacity-60" numberOfLines={4}>
                          {extractedPrivateKey}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            Clipboard.setString(extractedPrivateKey);
                            Alert.alert("Copied", "RSA Private Key copied. Paste it in the input field below to decrypt.");
                          }}
                          className="bg-primary rounded-xl py-2.5 items-center justify-center active:opacity-85"
                        >
                          <Text className="text-white font-bold text-xs">Copy RSA Private Key</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Decryption Node input */}
              <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none">
                <View className="flex-row items-center justify-between border-b border-border pb-3">
                  <View className="flex-row items-center gap-2">
                    <KeyRound size={16} color={colors.primary} />
                    <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                      RSA Private Key Input
                    </Text>
                  </View>
                  {hasSavedKey && (
                    <TouchableOpacity
                      onPress={() => setHasSavedKey(false)}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 active:opacity-75"
                    >
                      <Text className="text-primary text-[10px] font-bold">Replace Key</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {hasSavedKey ? (
                  <View className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex-row items-center gap-3">
                    <ShieldCheck size={20} color="#10b981" />
                    <View className="flex-1">
                      <Text className="text-emerald-500 text-xs font-semibold">
                        Key Authenticated
                      </Text>
                      <Text className="text-foreground opacity-50 text-[10px] mt-0.5">
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
                        placeholderTextColor="#64748b"
                        secureTextEntry={!showKey}
                        className="w-full bg-background border border-border text-foreground rounded-xl p-3 font-mono text-[10px]"
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
                        className="bg-primary/10 border border-primary/20 rounded-xl py-2.5 items-center justify-center active:opacity-75"
                      >
                        <Text className="text-primary text-xs font-bold">Save Key for Auto-Load</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Decrypt Trigger */}
              {transfer && (
                <TouchableOpacity
                  onPress={handleDecrypt}
                  disabled={decrypting}
                  className="bg-primary rounded-xl py-3.5 items-center justify-center active:opacity-85 shadow-sm"
                  style={{ opacity: decrypting ? 0.6 : 1 }}
                >
                  {decrypting ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-bold text-sm">Decrypting Payload...</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-bold text-sm">Decrypt Document</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Errors Container */}
              {decryptError !== "" && (
                <View className="border-red-500/20 bg-red-500/5 rounded-xl border p-4 shadow-sm">
                  <Text className="text-red-500 text-xs text-center font-semibold leading-5">
                    {decryptError}
                  </Text>
                </View>
              )}

              {/* Decrypted Output Container */}
              {decryptedText !== "" && (
                <View className="border-emerald-500/20 bg-emerald-500/5 rounded-xl border p-5 shadow-sm gap-4">
                  <View className="flex-row items-center gap-2">
                    <ShieldCheck size={16} color="#10b981" />
                    <Text className="text-emerald-500 text-xs font-semibold uppercase tracking-wider">
                      Decrypted Output
                    </Text>
                  </View>

                  {decryptedFileBase64 ? (
                    <View className="bg-background p-4 rounded-xl border border-border items-center justify-center gap-3">
                      <View className="w-12 h-12 rounded-full bg-emerald-500/10 items-center justify-center border border-emerald-500/20">
                        <Download size={20} color="#10b981" />
                      </View>
                      <View className="items-center">
                        <Text className="text-foreground font-semibold text-xs text-center px-2" numberOfLines={1}>
                          {decryptedFileName}
                        </Text>
                        <Text className="text-foreground opacity-50 text-[10px] mt-0.5">
                          Original binary payload restored
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleDownloadFile}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4 py-2.5 w-full items-center justify-center active:bg-emerald-800 flex-row gap-1.5"
                      >
                        <Download size={14} color="#fff" />
                        <Text className="text-white font-bold text-xs">Save File to Device</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View className="gap-1.5">
                    <Text className="text-foreground opacity-50 text-[10px] font-bold uppercase tracking-wider">
                      Plaintext Transcript
                    </Text>
                    <Text className="text-foreground font-mono text-xs bg-background p-3.5 rounded-xl border border-border leading-5">
                      {decryptedText}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSheetVisible(true)}
                    className="bg-background border border-border rounded-xl py-3 items-center justify-center active:opacity-75"
                  >
                    <Text className="text-foreground font-bold text-xs">Manage Payload</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!transfer && (
                <View className="border-border bg-card rounded-xl border p-6 items-center justify-center shadow-sm gap-4">
                  <Text className="text-foreground opacity-60 text-xs text-center leading-5">
                    Open your secure inbox to load an encrypted transfer document into the decryptor module.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/inbox")}
                    className="bg-primary rounded-xl px-5 py-3 active:opacity-85 w-full items-center"
                  >
                    <Text className="text-white font-bold text-xs">Go to Inbox</Text>
                  </TouchableOpacity>
                </View>
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
