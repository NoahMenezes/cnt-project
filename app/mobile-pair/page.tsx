"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import { BorderBeam } from "@/components/ui/border-beam";
import {
  Smartphone,
  QrCode,
  CheckCircle,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  Wifi,
} from "lucide-react";

const NAV = [
  { title: "Home", href: "/" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Operation Lab", href: "/analyze" },
  { title: "Hybrid Lab", href: "/hybrid-lab" },
  { title: "Mobile Pair", href: "/mobile-pair", isActive: true },
];

interface Device {
  id: string;
  device_name: string;
  created_at: string;
}

export default function MobilePairPage() {
  const { user } = useUser();
  const userId = user?.id;
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDevice, setNewDevice] = useState<Device | null>(null);
  const [qrPayload, setQrPayload] = useState<string>("");

  const fetchDevices = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("user_devices")
      .select("id, device_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setDevices((data as Device[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      supabase
        .from("user_devices")
        .select("id, device_name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setDevices((data as Device[]) ?? []);
          setLoading(false);
        });
    }
  }, [userId]);

  async function handleCreateDevice() {
    if (!user?.id || !newDeviceName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("user_devices")
      .insert({
        user_id: user.id,
        device_name: newDeviceName.trim(),
        public_key: "pending",
      })
      .select()
      .single();

    if (!error && data) {
      const device = data as Device;
      const payload = JSON.stringify({
        deviceId: device.id,
        deviceName: device.device_name,
        userId: user.id,
      });
      setQrPayload(payload);
      setNewDevice(device);
      setDevices((prev) => [device, ...prev]);
      setNewDeviceName("");
    }
    setCreating(false);
  }

  async function handleDeleteDevice(id: string) {
    await supabase.from("user_devices").delete().eq("id", id);
    if (newDevice?.id === id) {
      setNewDevice(null);
      setQrPayload("");
    }
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header navigationData={NAV} />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Mobile Device Pairing
            </h1>
            <p className="text-sm text-foreground/50">
              Link your phone to receive encrypted payloads from this web app.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left: Add New Device ── */}
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur flex flex-col gap-5">
            <BorderBeam size={150} duration={8} colorFrom="#6366f1" colorTo="#3b82f6" />
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Pair New Device
              </h2>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
                Device Name
              </label>
              <input
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateDevice()}
                placeholder="e.g. Noah's Android"
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary/60"
              />
              <Button
                onClick={handleCreateDevice}
                disabled={creating || !newDeviceName.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 text-sm"
              >
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
                ) : (
                  <><QrCode className="h-4 w-4 mr-2" /> Generate QR Code</>
                )}
              </Button>
            </div>

            {/* QR Code Display */}
            {qrPayload && newDevice && (
              <div className="flex flex-col items-center gap-4 mt-2 p-5 rounded-xl bg-white border border-border/20">
                <QRCodeSVG
                  value={qrPayload}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0a0a0f"
                  level="H"
                />
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-slate-700 mb-1">
                    {newDevice.device_name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Open CipherVault on your phone → Scan QR Code
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-xl bg-foreground/[0.02] border border-border/20 p-4">
              <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-wider mb-2">
                How to Pair
              </p>
              <ol className="space-y-1.5">
                {[
                  "Enter a name for your phone above",
                  "Click \"Generate QR Code\"",
                  "Open the CipherVault mobile app",
                  "Tap \"Scan QR Code\" and scan",
                  "Your phone is now a decryption node",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-primary/60 mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-[11px] text-foreground/50">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ── Right: Registered Devices ── */}
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur flex flex-col gap-4">
            <BorderBeam size={150} duration={8} colorFrom="#3b82f6" colorTo="#8b5cf6" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Registered Devices
                </h2>
              </div>
              <button
                onClick={fetchDevices}
                className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Smartphone className="h-10 w-10 text-foreground/10 mb-3" />
                <p className="text-sm text-foreground/30">No devices paired yet.</p>
                <p className="text-xs text-foreground/20 mt-1">
                  Add your first device on the left.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/[0.02] border border-border/20 hover:border-border/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {device.device_name}
                      </p>
                      <p className="text-[10px] text-foreground/30 font-mono">
                        Paired {formatDate(device.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                      </div>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-1.5 rounded-lg text-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Security note */}
            <div className="mt-auto rounded-xl bg-foreground/[0.02] border border-border/10 p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0" />
                <p className="text-[11px] text-foreground/35 leading-4">
                  Private RSA keys are stored exclusively on your phone&apos;s hardware enclave.
                  They are never transmitted to the server.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
