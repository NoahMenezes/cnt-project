import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { CameraView, Camera } from "expo-camera";

import { supabase } from "@/lib/supabase";
import { saveDeviceId, saveDeviceName } from "@/lib/secureStore";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function ScanScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then((response) => {
      setHasPermission(response.status === "granted");
    });
  }, []);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      let transferId = "";
      let rawTransferStr = "";
      let isPairingQr = false;
      let pairingPayload: { deviceId?: string; deviceName?: string; userId?: string } = {};

      const isUrl = 
        data.startsWith("http://") || 
        data.startsWith("https://") || 
        data.startsWith("exp://") || 
        data.startsWith("ciphervault://");

      if (isUrl) {
        const urlPart = data.split("?")[1];
        if (urlPart) {
          const urlParams = new URLSearchParams(urlPart);
          transferId = urlParams.get("transferId") || "";
          rawTransferStr = urlParams.get("rawTransferStr") || "";
        }
      } else {
        try {
          const payload = JSON.parse(data);
          if (payload.transferId) {
            transferId = payload.transferId;
          }
          if (payload.rawTransfer) {
            rawTransferStr = JSON.stringify(payload.rawTransfer);
          }
          if (payload.deviceId && payload.userId) {
            isPairingQr = true;
            pairingPayload = payload;
          }
        } catch {
          // Keep fallthrough
        }
      }

      if (transferId || rawTransferStr) {
        Alert.alert(
          "🔒 Payload Detected",
          "An encrypted document transfer has been scanned. Load in Decryption Node?",
          [
            { text: "Cancel", style: "cancel", onPress: () => setScanned(false) },
            {
              text: "Load",
              onPress: () => {
                const params: any = {};
                if (transferId) params.transferId = transferId;
                if (rawTransferStr) params.rawTransferStr = rawTransferStr;
                
                router.replace({
                  pathname: "/",
                  params,
                });
              },
            },
          ]
        );
        return;
      }

      if (!isPairingQr || !pairingPayload.deviceId || !pairingPayload.userId) {
        Alert.alert("Invalid QR Code", "This QR code is not recognized by CipherVault.", [
          { text: "Try Again", onPress: () => setScanned(false) },
        ]);
        setProcessing(false);
        return;
      }

      const { data: device, error } = await supabase
        .from("user_devices")
        .select("id, device_name")
        .eq("id", pairingPayload.deviceId)
        .single();

      if (error || !device) {
        Alert.alert(
          "Device Not Found",
          "This QR code may have expired. Please generate a new one on the web app.",
          [{ text: "Try Again", onPress: () => setScanned(false) }]
        );
        setProcessing(false);
        return;
      }

      await saveDeviceId(device.id);
      await saveDeviceName(device.device_name);

      Alert.alert(
        "✅ Device Paired!",
        `This phone is now linked as "${device.device_name}". Encrypted payloads will appear in your Secure Inbox.`,
        [{ text: "Go to Inbox", onPress: () => router.replace("/inbox") }]
      );
    } catch {
      Alert.alert(
        "Scan Error",
        "Could not read QR code. Please try scanning again.",
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1" style={{ overflow: "hidden" }}>
      <AnimatedBackground />
      <Stack.Screen
        options={{
          title: "Scan QR Code",
          headerLargeTitle: false,
          headerTransparent: true,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="p-4 bg-transparent"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4 mt-24">
          <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
            <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
              Camera Scanner
            </Text>
            <Text className="text-foreground opacity-60 text-xs text-center">
              Scan a document transfer QR code from the web Operation Lab to load it directly.
            </Text>

            {hasPermission === null && (
              <View className="h-64 rounded-lg items-center justify-center border-border border">
                <Text className="text-foreground opacity-60 text-sm">
                  Requesting camera permission…
                </Text>
              </View>
            )}

            {hasPermission === false && (
              <View className="h-64 rounded-lg items-center justify-center border-border border gap-2">
                <Text className="text-foreground font-semibold text-sm text-center">
                  Camera Permission Required
                </Text>
                <Text className="text-foreground opacity-60 text-xs text-center px-4">
                  Please enable camera access in Settings.
                </Text>
              </View>
            )}

            {hasPermission === true && (
              <View className="rounded-xl overflow-hidden border border-border" style={{ height: 320 }}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                {processing && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <Text className="text-white font-semibold text-sm">Verifying…</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View className="border-border bg-card rounded-xl border p-4 shadow-sm shadow-black/10 dark:shadow-none">
            <Text className="text-foreground opacity-60 text-xs text-center leading-5">
              🔐 Pairing links this phone as a trusted decryption node.{"\n"}
              No private keys are transmitted — they stay on this device.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
