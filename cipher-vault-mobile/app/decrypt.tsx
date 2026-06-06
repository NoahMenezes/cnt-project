import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Share, Clipboard } from "react-native";
import { KeyRound, Eye, EyeOff, ShieldCheck, Download, Trash2, Key, Lock, ArrowRightLeft } from "lucide-react-native";

import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { useColorScheme } from "@/lib/useColorScheme";
import { getDeviceId } from "@/lib/secureStore";
import { supabase } from "@/lib/supabase";
import type { EphemeralTransfer } from "@/lib/supabase";
import { 
  extractRSAPrivateNumbers, 
  rsaDecryptString, 
  aesDecryptSim, 
  aesEncryptSim, 
  generateAESKeyHex 
} from "@/lib/crypto";
import CustomSheet from "@/components/CustomSheet";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function DecryptScreen() {
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
  const [showAesKey, setShowAesKey] = useState(false);
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

  // Mobile Encryption States
  const [encryptDocName, setEncryptDocName] = useState("Mobile Encrypted Document");
  const [encryptPlainText, setEncryptPlainText] = useState("");
  const [encryptAesKey, setEncryptAesKey] = useState("");
  const [encrypting, setEncrypting] = useState(false);
  
  // Sheet state
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    getDeviceId().then((id) => {
      setDeviceId(id);
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
        
        const actualESKey = keysObj.encrypted_session_key || "";
        setExtractedESKey(actualESKey);
        setEncryptedPayloadInput(tr.encrypted_payload || "");
        
        tr.encrypted_session_key = actualESKey;
      } else {
        setExtractedESKey(tr.encrypted_session_key || "");
        setEncryptedPayloadInput(tr.encrypted_payload || "");
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
    if (!aesKey.trim()) {
      setDecryptError("AES Key is empty. Decrypt the ES Key or paste a symmetric key first.");
      return;
    }
    if (!encryptedPayloadInput.trim()) {
      setDecryptError("Encrypted payload input is empty.");
      return;
    }

    setDecrypting(true);
    setDecryptError("");
    setDecryptedText("");
    setDecryptedFileBase64("");

    await new Promise((r) => setTimeout(r, 600));

    try {
      const plaintext = aesDecryptSim(encryptedPayloadInput.trim(), aesKey.trim());
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
            encrypted_session_key: `AES_KEY:${aesKey.trim()}`,
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
        setDecryptError("Decryption failed. Please verify your AES Key is correct.");
      }
    } catch (err) {
      setDecryptError(err instanceof Error ? err.message : "Symmetric decryption failed.");
    } finally {
      setDecrypting(false);
    }
  };

  const handleEncryptData = async () => {
    if (!encryptPlainText.trim()) {
      Alert.alert("Input Required", "Please enter some plaintext data to encrypt.");
      return;
    }
    if (!encryptAesKey.trim()) {
      Alert.alert("Input Required", "Please generate or paste an AES Key.");
      return;
    }
    if (!deviceId) {
      Alert.alert("Device Error", "Pair your mobile device first to insert to the database.");
      return;
    }

    setEncrypting(true);
    try {
      const { ciphertext, iv } = aesEncryptSim(encryptPlainText, encryptAesKey.trim());
      const { error } = await supabase.from("ephemeral_transfers").insert({
        device_id: deviceId,
        document_name: encryptDocName || "Mobile Encrypted Document",
        encrypted_payload: ciphertext,
        encrypted_session_key: encryptAesKey.trim(),
        aes_mode: "GCM",
        aes_iv: iv
      });

      if (!error) {
        Alert.alert("✅ Document Encrypted", "Encrypted document successfully saved to Supabase!");
        setEncryptPlainText("");
      } else {
        Alert.alert("Database Error", error.message);
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Encryption failed.");
    } finally {
      setEncrypting(false);
    }
  };

  const handleDownloadFile = () => {
    if (!decryptedFileBase64) return;
    try {
      const link = document.createElement("a");
      link.href = decryptedFileBase64;
      link.download = decryptedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert("Success", `Downloaded ${decryptedFileName} successfully.`);
    } catch (err) {
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

              {/* Transmission Keys Enclave Display */}
              {transfer && (extractedPrivateKey || extractedPublicKey || extractedAESKey || extractedESKey) && (
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
                    </View>
                  ) : null}

                  {extractedPrivateKey ? (
                    <View className="gap-1.5">
                      <Text className="text-foreground text-xs font-medium opacity-80">RSA Private Key</Text>
                      <View className="bg-background border border-border rounded-xl p-3 gap-2">
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
                  <View className="relative">
                    <TextInput
                      value={aesKey}
                      onChangeText={setAesKey}
                      placeholder="AES Symmetric Key (will auto-fill from Step 1)"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showAesKey}
                      className="w-full bg-background border border-border text-foreground rounded-xl p-3 font-mono text-[10px]"
                    />
                    <TouchableOpacity
                      onPress={() => setShowAesKey((v) => !v)}
                      className="absolute top-3.5 right-3"
                    >
                      {showAesKey ? (
                        <EyeOff size={14} color="#64748b" />
                      ) : (
                        <Eye size={14} color="#64748b" />
                      )}
                    </TouchableOpacity>
                  </View>
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

              {/* Encryption Node Section (Mobile Encryption) */}
              <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-5 shadow-sm shadow-black/10 dark:shadow-none">
                <Text className="text-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                  Encryption Node (Local Mobile Encrypt)
                </Text>

                <View className="gap-1">
                  <Text className="text-foreground text-xs font-medium opacity-70">Document Name</Text>
                  <TextInput
                    value={encryptDocName}
                    onChangeText={setEncryptDocName}
                    placeholder="Enter document name..."
                    placeholderTextColor="#64748b"
                    className="w-full bg-background border border-border text-foreground rounded-xl p-3 font-mono text-[10px]"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-foreground text-xs font-medium opacity-70">AES Key Hex (Symmetric)</Text>
                  <View className="flex-row gap-2">
                    <TextInput
                      value={encryptAesKey}
                      onChangeText={setEncryptAesKey}
                      placeholder="Symmetric AES Key..."
                      placeholderTextColor="#64748b"
                      className="flex-1 bg-background border border-border text-foreground rounded-xl p-2.5 font-mono text-[10px]"
                    />
                    <TouchableOpacity
                      onPress={() => setEncryptAesKey(generateAESKeyHex(256))}
                      className="bg-primary/10 border border-primary/20 px-3 items-center justify-center rounded-xl"
                    >
                      <Text className="text-primary text-[10px] font-bold">Generate</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="gap-1">
                  <Text className="text-foreground text-xs font-medium opacity-70">Plaintext to Encrypt</Text>
                  <TextInput
                    value={encryptPlainText}
                    onChangeText={setEncryptPlainText}
                    multiline
                    numberOfLines={3}
                    placeholder="Type private message here..."
                    placeholderTextColor="#64748b"
                    className="w-full bg-background border border-border text-foreground rounded-xl p-3 font-mono text-[10px]"
                    style={{ minHeight: 70, textAlignVertical: "top" }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleEncryptData}
                  disabled={encrypting}
                  className="bg-primary rounded-xl py-3 items-center justify-center active:opacity-85 shadow-sm"
                  style={{ opacity: encrypting ? 0.6 : 1 }}
                >
                  {encrypting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-xs">Encrypt & Save to Database</Text>
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
