import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Share, Clipboard } from "react-native";
import { KeyRound, Eye, EyeOff, ShieldCheck, Download, Trash2, Key, Lock } from "lucide-react-native";

import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import { 
  extractRSAPrivateNumbers, 
  rsaDecryptString, 
  aesDecryptSim,
  hybridDecrypt
} from "@/lib/crypto";
import CustomSheet from "@/components/CustomSheet";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function HomeScreen() {
  const { transferId, rawTransferStr } = useLocalSearchParams<{ transferId?: string, rawTransferStr?: string }>();
  const router = useRouter();
  const { colors } = useColorScheme();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<EphemeralTransfer | null>(null);
  const [loadingTransfer, setLoadingTransfer] = useState(!!transferId || !!rawTransferStr);
  
  // Decryption inputs (ALWAYS empty on mount)
  const [privateKey, setPrivateKey] = useState("");
  const [esKey, setEsKey] = useState("");
  const [encryptedPayloadInput, setEncryptedPayloadInput] = useState("");
  const [aesKey, setAesKey] = useState("");

  const [showKey, setShowKey] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  
  const [decryptedText, setDecryptedText] = useState("");
  const [decryptedFileBase64, setDecryptedFileBase64] = useState("");
  const [decryptedFileName, setDecryptedFileName] = useState("Decrypted Document");
  const [decryptError, setDecryptError] = useState("");

  // Extracted Keys for Display (from parsed synced transfer, but do NOT prefill inputs)
  const [extractedPrivateKey, setExtractedPrivateKey] = useState("");
  const [extractedPublicKey, setExtractedPublicKey] = useState("");
  const [extractedAESKey, setExtractedAESKey] = useState("");
  const [extractedESKey, setExtractedESKey] = useState("");

  // Sheet state
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    getDeviceId().then((id) => {
      setDeviceId(id);
    });
  }, []);

  // Real-time sync: listen on device channel for clear_keys / keys_updated from the web app
  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase
      .channel(`device_sync_${deviceId}`)
      .on("broadcast", { event: "clear_keys" }, () => {
        // New document being analyzed — wipe stale keys immediately
        setExtractedPrivateKey("");
        setExtractedPublicKey("");
        setExtractedAESKey("");
        setExtractedESKey("");
        setPrivateKey("");
        setEsKey("");
        setAesKey("");
        setEncryptedPayloadInput("");
        setDecryptedText("");
        setDecryptedFileBase64("");
        setDecryptedFileName("Decrypted Document");
        setDecryptError("");
        setTransfer(null);
      })
      .on("broadcast", { event: "keys_updated" }, (msg: { payload: { transferId: string } }) => {
        const newTransferId = msg?.payload?.transferId;
        if (!newTransferId) return;
        supabase
          .from("ephemeral_transfers")
          .select("*")
          .eq("id", newTransferId)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              const tr = parseKeysFromTransfer(data as EphemeralTransfer);
              setTransfer(tr);
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const parseKeysFromTransfer = (tr: EphemeralTransfer) => {
    try {
      if (tr.encrypted_session_key && tr.encrypted_session_key.trim().startsWith("{")) {
        const keysObj = JSON.parse(tr.encrypted_session_key);
        if (keysObj.rsa_private_key) {
          setExtractedPrivateKey(keysObj.rsa_private_key);
          setPrivateKey(keysObj.rsa_private_key);
        }
        if (keysObj.rsa_public_key) {
          setExtractedPublicKey(keysObj.rsa_public_key);
        }
        if (keysObj.aes_key) {
          setExtractedAESKey(keysObj.aes_key);
        }
        
        const actualESKey = keysObj.encrypted_session_key || "";
        setExtractedESKey(actualESKey);
        setEncryptedPayloadInput(tr.encrypted_payload || "");
        setEsKey(actualESKey);
        
        tr.encrypted_session_key = actualESKey;
      } else {
        const actualESKey = tr.encrypted_session_key || "";
        setExtractedESKey(actualESKey);
        setEncryptedPayloadInput(tr.encrypted_payload || "");
        setEsKey(actualESKey);
      }
    } catch (e) {
      // Ignore
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

  const handleDecryptESKey = () => {
    if (!privateKey.trim()) {
      Alert.alert("Input Required", "Please paste your RSA Private Key.");
      return;
    }
    if (!esKey.trim()) {
      Alert.alert("Input Required", "Please paste your Encrypted Session Key (ES Key).");
      return;
    }

    const parsed = extractRSAPrivateNumbers(privateKey.trim());
    if (!parsed) {
      Alert.alert("Error", "Could not read RSA private key. Make sure it is copied completely.");
      return;
    }

    try {
      const { d, n } = parsed;
      const unwrapped = rsaDecryptString(esKey.trim(), d, n);
      if (unwrapped && unwrapped.trim()) {
        setAesKey(unwrapped.trim());
        Alert.alert("✅ AES Key Decrypted", `Successfully unwrapped the AES key: ${unwrapped}`);
      } else {
        Alert.alert("Error", "RSA decryption yielded an empty string. Verify your keys.");
      }
    } catch (err) {
      Alert.alert("Decryption Error", err instanceof Error ? err.message : String(err));
    }
  };

  const handleDecryptDocument = async () => {
    const ciphertextToDecrypt = encryptedPayloadInput.trim() || transfer?.encrypted_payload || "";
    if (!ciphertextToDecrypt) {
      setDecryptError("Encrypted payload input is empty.");
      return;
    }

    const encSessionKey = esKey.trim() || transfer?.encrypted_session_key || extractedESKey || "";

    setDecrypting(true);
    setDecryptError("");
    setDecryptedText("");
    setDecryptedFileBase64("");

    await new Promise((r) => setTimeout(r, 600));

    try {
      let plaintext = "";
      let activeAesKey = aesKey.trim();

      // If we have a private key, perform hybrid decryption (RSA unwrapping of ES key + AES decryption)
      if (privateKey.trim()) {
        const result = hybridDecrypt(ciphertextToDecrypt, encSessionKey, privateKey.trim());
        if (result.success) {
          plaintext = result.plaintext;
          
          // Automatically extract and show the decrypted AES key in Step 2 input
          const parsedPriv = extractRSAPrivateNumbers(privateKey.trim());
          if (parsedPriv && encSessionKey) {
            const { d, n } = parsedPriv;
            const unwrappedAesKey = rsaDecryptString(encSessionKey, d, n);
            if (unwrappedAesKey) {
              activeAesKey = unwrappedAesKey.trim();
              setAesKey(activeAesKey);
            }
          }
        } else {
          throw new Error(result.error || "Decryption failed. Please verify your RSA Private Key.");
        }
      } else if (activeAesKey) {
        // Otherwise, fall back to standard AES decryption if only the symmetric key is provided
        plaintext = aesDecryptSim(ciphertextToDecrypt, activeAesKey);
      } else {
        throw new Error("Please paste your RSA Private Key (Step 1) or Decrypted AES Key (Step 2) to decrypt.");
      }

      if (plaintext && plaintext.trim()) {
        let dispText = plaintext;
        let b64 = "";
        let fName = "Decrypted Document";

        try {
          if (plaintext.trim().startsWith("{")) {
            const parsed = JSON.parse(plaintext);
            if (parsed.type === "file_package") {
              dispText = parsed.plaintext;
              b64 = parsed.fileBase64;
              fName = parsed.fileName || fName;
            }
          }
        } catch (e) {
          // Not a JSON package
        }

        setDecryptedText(dispText);
        setDecryptedFileBase64(b64);
        setDecryptedFileName(fName);

        // Store decrypted log record in Supabase
        if (deviceId) {
          await supabase.from("ephemeral_transfers").insert({
            device_id: deviceId,
            document_name: `Decrypted: ${fName}`,
            encrypted_payload: dispText,
            encrypted_session_key: activeAesKey ? `AES_KEY:${activeAesKey}` : "RSA_ONLY",
            aes_mode: "GCM",
            aes_iv: ""
          });
        }

        // Broadcast decryption completion to the website and delete transfer (burn)
        if (transfer && transfer.id) {
          const broadcastChannel = supabase.channel(`transfer_channel_${transfer.id}`);
          await broadcastChannel.subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              await broadcastChannel.send({
                type: "broadcast",
                event: "decrypted",
                payload: { decrypted: true },
              });
              supabase.removeChannel(broadcastChannel);
            }
          });

          // Delete the temporary transfer to trigger fallback listener
          await supabase.from("ephemeral_transfers").delete().eq("id", transfer.id);
        }
      } else {
        setDecryptError("Decryption failed. Please verify your keys and payload.");
      }
    } catch (err) {
      setDecryptError(err instanceof Error ? err.message : "Decryption failed.");
    } finally {
      setDecrypting(false);
    }
  };


  const handleDownloadFile = () => {
    if (!decryptedFileBase64) return;
    Share.share({
      url: decryptedFileBase64,
      title: decryptedFileName,
      message: `Decrypted document: ${decryptedFileName}`
    });
  };

  const handleShareDocument = async () => {
    if (!decryptedText) return;
    try {
      await Share.share({
        message: decryptedText,
        title: decryptedFileName || "Decrypted Document",
      });
    } catch (err) {
      Alert.alert("Share Error", err instanceof Error ? err.message : "Could not share.");
    }
  };

  const handleDownloadDocument = async () => {
    if (!decryptedText) return;
    try {
      // Share the plaintext as a file via the OS share sheet (works on iOS & Android)
      await Share.share({
        message: decryptedText,
        title: (decryptedFileName || "decrypted_document") + ".txt",
      });
    } catch (err) {
      Alert.alert("Download Error", err instanceof Error ? err.message : "Could not download.");
    }
  };

  const [storing, setStoring] = useState(false);

  const handleStoreToDatabase = async () => {
    if (!decryptedText) return;
    setStoring(true);
    try {
      let activeDeviceId = deviceId;

      // If no paired device, auto-register a guest device so FK constraint is satisfied
      if (!activeDeviceId) {
        const guestId = `guest-${Date.now()}`;
        const { data: newDevice, error: devErr } = await supabase
          .from("user_devices")
          .insert({
            user_id: guestId,
            device_name: "Mobile (Guest)",
            public_key: "guest",
          })
          .select("id")
          .single();

        if (devErr || !newDevice) {
          Alert.alert("Error", "Could not register device. " + (devErr?.message ?? ""));
          setStoring(false);
          return;
        }
        activeDeviceId = newDevice.id;
      }

      const { error } = await supabase.from("ephemeral_transfers").insert({
        device_id: activeDeviceId,
        document_name: `Stored: ${decryptedFileName || "Decrypted Document"}`,
        encrypted_payload: decryptedText,
        encrypted_session_key: aesKey ? `AES_KEY:${aesKey}` : "PLAINTEXT_STORED",
        aes_mode: "GCM",
        aes_iv: ""
      });

      if (!error) {
        Alert.alert("✅ Stored", "Document saved to your secure database successfully.");
      } else {
        Alert.alert("Database Error", error.message);
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to store.");
    } finally {
      setStoring(false);
    }
  };

  const resultOptions = [
    {
      label: "📋 Copy to Clipboard",
      onPress: () => {
        Clipboard.setString(decryptedText);
        Alert.alert("Copied", "Decrypted text copied to clipboard.");
      },
    },
    {
      label: "🔗 Share Document",
      onPress: handleShareDocument,
    },
    {
      label: "⬇️ Download as .txt",
      onPress: handleDownloadDocument,
    },
    {
      label: "💾 Store in Database",
      onPress: handleStoreToDatabase,
    },
  ];

  return (
    <View className="flex-1" style={{ overflow: "hidden" }}>
      {/* Dynamic Animated Motion Background */}
      <AnimatedBackground />

      <Stack.Screen
        options={{
          title: "Decryption Node",
          headerLargeTitle: true,
          headerTransparent: true,
        }}
      />

      <ScrollView 
        contentInsetAdjustmentBehavior="automatic" 
        className="p-4 bg-transparent"
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
              
              {/* Document Title Header */}
              {transfer && (
                <View className="items-center mb-2">
                  <Text className="text-foreground opacity-60 text-[10px] font-bold uppercase tracking-wider">
                    Active Decryption Document
                  </Text>
                  <Text className="text-foreground text-xl font-extrabold text-center mt-1">
                    {transfer.document_name}
                  </Text>
                </View>
              )}

              {/* Source Package Info */}
              {transfer && (
                <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none">
                  <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                    Source Package Details
                  </Text>
                  <View className="gap-1.5">
                    <Text className="text-foreground text-sm font-medium">
                      Name: {transfer.document_name}
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

              {/* Transmission Keys Enclave Display — shows whenever any key is extracted */}
              {(extractedPrivateKey || extractedPublicKey || extractedAESKey || extractedESKey) && (
                <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none">
                  <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                    Transmission Keys Enclave
                  </Text>

                  {extractedESKey ? (
                    <View className="gap-1.5">
                      <Text className="text-foreground text-xs font-medium opacity-80">Encrypted Session Key (ES Key)</Text>
                      <View className="flex-row gap-2 items-center bg-background border border-border rounded-xl p-2.5">
                        <Text className="text-foreground font-mono text-[10px] flex-1" numberOfLines={1}>
                          {extractedESKey}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            Clipboard.setString(extractedESKey);
                            Alert.alert("Copied", "ES Key copied to clipboard.");
                          }}
                          className="bg-primary/10 px-3 py-1.5 rounded-lg active:opacity-75"
                        >
                          <Text className="text-primary text-[10px] font-bold">Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setEsKey(extractedESKey);
                          Alert.alert("✅ Filled", "ES Key inserted into Step 1 input.");
                        }}
                        className="bg-primary/5 border border-primary/20 rounded-lg py-2 items-center"
                      >
                        <Text className="text-primary text-[10px] font-semibold">Use in Step 1 → ES Key Input</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {extractedAESKey ? (
                    <View className="gap-1.5">
                      <Text className="text-foreground text-xs font-medium opacity-80">AES Session Key (Reference)</Text>
                      <View className="flex-row gap-2 items-center bg-background border border-border rounded-xl p-2.5">
                        <Text className="text-foreground font-mono text-[10px] flex-1" numberOfLines={1}>
                          {extractedAESKey}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            Clipboard.setString(extractedAESKey);
                            Alert.alert("Copied", "AES key copied to clipboard.");
                          }}
                          className="bg-primary/10 px-3 py-1.5 rounded-lg active:opacity-75"
                        >
                          <Text className="text-primary text-[10px] font-bold">Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setAesKey(extractedAESKey);
                          Alert.alert("✅ Filled", "AES Key inserted into Step 2 input.");
                        }}
                        className="bg-primary/5 border border-primary/20 rounded-lg py-2 items-center"
                      >
                        <Text className="text-primary text-[10px] font-semibold">Use in Step 2 → AES Key Input</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {extractedPrivateKey ? (
                    <View className="gap-1.5">
                      <Text className="text-foreground text-xs font-medium opacity-80">RSA Private Key</Text>
                      <View className="bg-background border border-border rounded-xl p-3 gap-2">
                        <Text className="text-foreground font-mono text-[9px] opacity-60" numberOfLines={4}>
                          {extractedPrivateKey}
                        </Text>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => {
                              Clipboard.setString(extractedPrivateKey);
                              Alert.alert("Copied", "RSA Private Key copied to clipboard.");
                            }}
                            className="flex-1 border border-border bg-background rounded-xl py-2.5 items-center justify-center active:opacity-75"
                          >
                            <Text className="text-foreground font-bold text-xs">Copy</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setPrivateKey(extractedPrivateKey);
                              Alert.alert("✅ Filled", "RSA Private Key inserted into Step 1 input.");
                            }}
                            className="flex-1 bg-primary rounded-xl py-2.5 items-center justify-center active:opacity-85"
                          >
                            <Text className="text-white font-bold text-xs">Use in Step 1</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Step 1: RSA Decrypt ES Key Section */}
              <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                  Step 1: RSA Session Key Unwrap
                </Text>

                <View className="gap-1">
                  <Text className="text-foreground text-xs font-medium opacity-70">RSA Private Key Input</Text>
                  <View className="relative">
                    <TextInput
                      value={privateKey}
                      onChangeText={setPrivateKey}
                      multiline
                      numberOfLines={4}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showKey}
                      className="w-full bg-background border border-border text-foreground rounded-xl p-3 font-mono text-[10px]"
                      style={{ minHeight: 90, textAlignVertical: "top" }}
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
                </View>

                <View className="gap-1">
                  <Text className="text-foreground text-xs font-medium opacity-70">Encrypted Session Key (ES Key) Input</Text>
                  <TextInput
                    value={esKey}
                    onChangeText={setEsKey}
                    placeholder="Paste encrypted session key..."
                    placeholderTextColor="#64748b"
                    className="w-full bg-background border border-border text-foreground rounded-xl p-3 font-mono text-[10px]"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleDecryptESKey}
                  className="bg-primary rounded-xl py-3 items-center justify-center active:opacity-85 shadow-sm"
                >
                  <Text className="text-white font-bold text-xs">Decrypt Session Key (RSA)</Text>
                </TouchableOpacity>
              </View>

              {/* Step 2: AES Decrypt Payload Section */}
              <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                  Step 2: Document Payload Decryption
                </Text>

                <View className="gap-1">
                  <Text className="text-foreground text-xs font-medium opacity-70">Decrypted AES Key Input</Text>
                  <TextInput
                    value={aesKey}
                    onChangeText={setAesKey}
                    placeholder="AES Symmetric Key (will auto-fill from Step 1)"
                    placeholderTextColor="#64748b"
                    className="w-full bg-background border border-border text-foreground rounded-xl p-3 font-mono text-[10px]"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-foreground text-xs font-medium opacity-70">Encrypted Document Payload (Ciphertext)</Text>
                  <TextInput
                    value={encryptedPayloadInput}
                    onChangeText={setEncryptedPayloadInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Paste encrypted payload..."
                    placeholderTextColor="#64748b"
                    className="w-full bg-background border border-border text-foreground rounded-xl p-3 font-mono text-[10px]"
                    style={{ minHeight: 90, textAlignVertical: "top" }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleDecryptDocument}
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
                    <Text className="text-white font-bold text-sm">Decrypt Document (AES)</Text>
                  )}
                </TouchableOpacity>
              </View>

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

                  {/* Three Action Buttons */}
                  <View className="gap-2">
                    {/* Store */}
                    <TouchableOpacity
                      onPress={handleStoreToDatabase}
                      disabled={storing}
                      className="bg-emerald-600 rounded-xl py-3.5 items-center justify-center active:opacity-85 flex-row gap-2"
                      style={{ opacity: storing ? 0.6 : 1 }}
                    >
                      {storing ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="text-white font-bold text-sm">💾 Store in Database</Text>
                      )}
                    </TouchableOpacity>

                    {/* Share */}
                    <TouchableOpacity
                      onPress={handleShareDocument}
                      className="bg-blue-600 rounded-xl py-3.5 items-center justify-center active:opacity-85 flex-row gap-2"
                    >
                      <Text className="text-white font-bold text-sm">🔗 Share Document</Text>
                    </TouchableOpacity>

                    {/* Download */}
                    <TouchableOpacity
                      onPress={handleDownloadDocument}
                      className="bg-background border border-border rounded-xl py-3.5 items-center justify-center active:opacity-75 flex-row gap-2"
                    >
                      <Text className="text-foreground font-bold text-sm">⬇️ Download as .txt</Text>
                    </TouchableOpacity>
                  </View>
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
