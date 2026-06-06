"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Smartphone, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";

function DecryptDeepLinkContent() {
  const searchParams = useSearchParams();
  const transferId = searchParams.get("transferId");
  const rawTransferStr = searchParams.get("rawTransferStr");
  const [localIP, setLocalIP] = useState("");

  useEffect(() => {
    fetch("/api/local-ip")
      .then((res) => res.json())
      .then((data) => setLocalIP(data.ip || "localhost"))
      .catch(() => {});
  }, []);

  const getExpoUrl = () => {
    let url = `exp://${localIP || "localhost"}:8081/`;
    const params = new URLSearchParams();
    if (transferId) params.append("transferId", transferId);
    if (rawTransferStr) params.append("rawTransferStr", rawTransferStr);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    return url;
  };

  const getNativeAppUrl = () => {
    let url = `ciphervault://decrypt`;
    const params = new URLSearchParams();
    if (transferId) params.append("transferId", transferId);
    if (rawTransferStr) params.append("rawTransferStr", rawTransferStr);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    return url;
  };

  return (
    <>
      <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6">
        <Shield className="h-8 w-8 text-indigo-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground text-center mb-2">
        Encrypted Payload Ready
      </h1>
      <p className="text-sm text-foreground/60 text-center mb-10 leading-relaxed">
        You have received a secure document transfer. Choose how you want to open this payload to decrypt it.
      </p>

      <div className="w-full space-y-4">
        <a href={getExpoUrl()} className="block w-full">
          <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-3">
            <Zap className="h-5 w-5" />
            <span className="text-base font-bold">Open in Expo Go</span>
          </Button>
        </a>
        
        <a href={getNativeAppUrl()} className="block w-full">
          <Button variant="outline" className="w-full h-14 border-border/40 hover:bg-foreground/5 rounded-xl flex items-center justify-center gap-3">
            <Smartphone className="h-5 w-5 text-foreground/70" />
            <span className="text-base font-semibold text-foreground/80">Open in Native App</span>
          </Button>
        </a>
      </div>

      <p className="text-[10px] text-foreground/40 text-center mt-12 max-w-[280px]">
        If you don't have the CipherVault app installed, you will need to download it or use Expo Go to proceed.
      </p>
    </>
  );
}

export default function DecryptDeepLinkPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header navigationData={[{ title: "Home", href: "/" }, { title: "Dashboard", href: "/dashboard" }]} />
      <main className="mx-auto max-w-md px-4 pt-32 pb-16 flex flex-col items-center justify-center">
        <Suspense fallback={<Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />}>
          <DecryptDeepLinkContent />
        </Suspense>
      </main>
    </div>
  );
}
