import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { CameraView, Camera } from "expo-camera";

import { supabase } from "@/lib/supabase";
import { saveDeviceId, saveDeviceName } from "@/lib/secureStore";

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
      const payload = JSON.parse(data) as {
        deviceId: string;
        deviceName: string;
        userId: string;
      };

      if (!payload.deviceId || !payload.userId) {
        Alert.alert("Invalid QR Code", "This QR code is not from CipherVault.", [
          { text: "Try Again", onPress: () => setScanned(false) },
        ]);
        setProcessing(false);
        return;
      }

      const { data: device, error } = await supabase
        .from("user_devices")
        .select("id, device_name")
        .eq("id", payload.deviceId)
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
        "Could not read QR code. Please scan the CipherVault pairing QR code.",
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Scan QR Code",
          headerLargeTitle: false,
          headerTransparent: true,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="p-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          <View className="border-border bg-card gap-4 rounded-xl border p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
            <Text className="text-foreground text-center text-sm font-medium tracking-wider opacity-60">
              Camera
            </Text>
            <Text className="text-muted-foreground text-xs text-center">
              Go to the web app → Mobile Pair → Generate QR Code, then scan it here.
            </Text>

            {hasPermission === null && (
              <View className="h-64 rounded-lg items-center justify-center border-border border">
                <Text className="text-muted-foreground text-sm">
                  Requesting camera permission…
                </Text>
              </View>
            )}

            {hasPermission === false && (
              <View className="h-64 rounded-lg items-center justify-center border-border border gap-2">
                <Text className="text-foreground font-semibold text-sm text-center">
                  Camera Permission Required
                </Text>
                <Text className="text-muted-foreground text-xs text-center px-4">
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
            <Text className="text-muted-foreground text-xs text-center leading-5">
              🔐 Pairing links this phone as a trusted decryption node.{"\n"}
              No private keys are transmitted — they stay on this device.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
