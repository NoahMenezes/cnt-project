import { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { CameraView, Camera } from "expo-camera";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { saveDeviceId, saveDeviceName } from "@/lib/secureStore";

export default function ScanScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }: { status: string }) => {
      setHasPermission(status === "granted");
    });
  }, []);

  const handleBarCodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      // QR payload format: { deviceId, deviceName, userId }
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

      // Verify the device exists in Supabase
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

      // Save device info locally
      await saveDeviceId(device.id);
      await saveDeviceName(device.device_name);

      Alert.alert(
        "✅ Device Paired!",
        `This phone is now linked as "${device.device_name}". Encrypted payloads from the web app will appear in your Secure Inbox.`,
        [{ text: "Go to Inbox", onPress: () => router.replace("/inbox") }]
      );
    } catch {
      Alert.alert(
        "Scan Error",
        "Could not read QR code. Please make sure you are scanning the CipherVault pairing QR code.",
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-[#0a0a0f] items-center justify-center">
        <Text className="text-slate-400 text-sm">Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-[#0a0a0f] items-center justify-center px-8">
        <Text className="text-white text-base font-semibold mb-2 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-slate-500 text-sm text-center">
          Please enable camera access in Settings to scan the pairing QR code.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      {/* Blue glow accent */}
      <View
        className="absolute bottom-0 right-0 w-56 h-56 rounded-full opacity-15"
        style={{
          backgroundColor: "#6366f1",
          transform: [{ translateX: 60 }, { translateY: 60 }],
          shadowColor: "#6366f1",
          shadowRadius: 60,
          shadowOpacity: 1,
          elevation: 20,
        }}
      />

      <View className="px-5 pt-4 pb-3">
        <Text className="text-white text-base font-semibold mb-1">
          Scan Pairing QR Code
        </Text>
        <Text className="text-slate-500 text-xs">
          Open the web app → Operation Lab → "Pair Mobile Device" and scan the QR code shown.
        </Text>
      </View>

      {/* Camera Viewfinder */}
      <View className="mx-5 rounded-2xl overflow-hidden border border-[#1e1e2e]" style={{ height: 340 }}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        {/* Corner markers */}
        <View className="absolute top-5 left-5 w-8 h-8 border-t-2 border-l-2 border-indigo-500 rounded-tl-md" />
        <View className="absolute top-5 right-5 w-8 h-8 border-t-2 border-r-2 border-indigo-500 rounded-tr-md" />
        <View className="absolute bottom-5 left-5 w-8 h-8 border-b-2 border-l-2 border-indigo-500 rounded-bl-md" />
        <View className="absolute bottom-5 right-5 w-8 h-8 border-b-2 border-r-2 border-indigo-500 rounded-br-md" />

        {processing && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center">
            <Text className="text-white font-semibold text-sm">Verifying…</Text>
          </View>
        )}
      </View>

      <View className="mx-5 mt-4 p-4 rounded-xl border border-[#1e1e2e] bg-[#111118]">
        <Text className="text-[11px] text-slate-600 text-center leading-5">
          🔐 Pairing links this phone as a trusted decryption node.{"\n"}
          No private keys are transmitted — they stay on this device.
        </Text>
      </View>
    </View>
  );
}
