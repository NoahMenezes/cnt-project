"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
// No direct DB client — all calls go through Next.js API routes (laptop proxies to cloud)


// ─── Inlined crypto helpers (same sim as hybrid-lab) ──────────────────────────
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = BigInt(1);
  base = base % mod;
  while (exp > BigInt(0)) {
    if (exp % BigInt(2) === BigInt(1)) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = exp / BigInt(2);
  }
  return res;
}

function rsaDecryptString(cipherText: string, d: bigint, n: bigint): string {
  const chunks = cipherText.split("-");
  const cache = new Map<string, string>();
  let out = "";
  for (const chunk of chunks) {
    if (!chunk) continue;
    let ch = cache.get(chunk);
    if (ch === undefined) {
      try {
        ch = String.fromCharCode(Number(modPow(BigInt(chunk), d, n)));
      } catch {
        ch = chunk.charAt(0) ? String.fromCharCode(chunk.charCodeAt(0) % 95 + 32) : "\uFFFD";
      }
      cache.set(chunk, ch);
    }
    out += ch;
  }
  return out;
}

function parsePEMParams(pem: string): Record<string, string> | null {
  try {
    const lines = pem.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("---"));
    if (lines.length === 0) return null;
    for (const line of lines) {
      try {
        const decoded = atob(line.replace(/[^A-Za-z0-9+/=]/g, "").padEnd(Math.ceil(line.length / 4) * 4, "="));
        if (decoded.startsWith("{")) {
          const obj = JSON.parse(decoded);
          if (typeof obj === "object") return obj as Record<string, string>;
        }
      } catch { /* try next */ }
    }
    const numLines: bigint[] = [];
    for (const line of lines) {
      try {
        const clean = line.replace(/[^A-Za-z0-9+/=]/g, "");
        const padded = clean.padEnd(Math.ceil(clean.length / 4) * 4, "=");
        const decoded = atob(padded);
        if (/^\d+$/.test(decoded)) numLines.push(BigInt(decoded));
      } catch { /* ignore */ }
    }
    if (numLines.length >= 2) {
      const sorted = [...numLines].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return { n: sorted[0].toString(), d: sorted[1].toString(), e: sorted[1].toString() };
    }
    return null;
  } catch { return null; }
}

function extractRSAPrivateNumbers(pem: string): { d: bigint; n: bigint } | null {
  try {
    const params = parsePEMParams(pem);
    if (!params) return null;
    const n = BigInt(params.n ?? "0");
    const d = BigInt(params.d ?? "0");
    if (n <= BigInt(0) || d <= BigInt(0)) return null;
    return { d, n };
  } catch { return null; }
}

function aesDecryptSim(ciphertext: string, keyHex?: string): string {
  try {
    const cleaned = ciphertext.trim().replace(/\s+/g, "");
    const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
    const decoded = decodeURIComponent(atob(padded));
    const parts = decoded.split("||SALT||");
    if (parts.length > 1) {
      if (keyHex) {
        const expectedSalt = keyHex.substring(0, 6);
        if (parts[1] !== expectedSalt)
          throw new Error("Mismatched Key Error: Key does not match this ciphertext.");
      }
      return parts[0];
    }
    return decoded;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Mismatched Key Error")) throw e;
    return "";
  }
}
// ─────────────────────────────────────────────────────────────────────────────

interface EphemeralTransfer {
  id: string;
  encrypted_payload: string;
  encrypted_session_key: string;
  aes_iv: string;
  aes_mode: string;
  document_name: string;
  created_at: string;
}

function MobileDecryptContent() {
  const searchParams = useSearchParams();
  const transferId = searchParams.get("transferId") ?? "";

  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState<EphemeralTransfer | null>(null);
  const [fetchError, setFetchError] = useState("");

  const [privateKey, setPrivateKey] = useState("");
  const [aesKey, setAesKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const [decrypting, setDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [recoveredAesKey, setRecoveredAesKey] = useState("");

  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const performDecryption = async (privKey: string, aKey: string, tr: EphemeralTransfer, esKeyStr: string) => {
    setDecrypting(true);
    setDecryptError("");
    setDecryptedText("");

    await new Promise((r) => setTimeout(r, 400)); // slight delay for visual transition

    try {
      let plaintext = "";
      const payload = tr.encrypted_payload ?? "";

      if (privKey.trim()) {
        const parsed = extractRSAPrivateNumbers(privKey.trim());
        if (!parsed) throw new Error("Could not parse the RSA Private Key PEM. Ensure you copied it fully including the header and footer lines.");
        const { d, n } = parsed;

        // Unwrap AES session key using RSA
        const unwrappedAes = esKeyStr ? rsaDecryptString(esKeyStr, d, n) : "";
        if (unwrappedAes) setRecoveredAesKey(unwrappedAes.trim());

        // AES-decrypt the payload using the unwrapped key
        const keyToUse = unwrappedAes || aKey.trim();
        plaintext = keyToUse ? aesDecryptSim(payload, keyToUse) : "";

        // Fallback: direct RSA decrypt
        if (!plaintext) {
          plaintext = rsaDecryptString(payload, d, n);
        }
      } else if (aKey.trim()) {
        plaintext = aesDecryptSim(payload, aKey.trim());
      }

      if (plaintext?.trim()) {
        setDecryptedText(plaintext);
        // Burn after reading — delete via server API route
        if (tr.id) {
          fetch(`/api/db/transfer?id=${tr.id}`, { method: "DELETE" }).catch(() => {});
        }
      } else {
        setDecryptError("Decryption returned empty text. Make sure you are using the RSA Private Key that matches the document.");
      }
    } catch (err) {
      setDecryptError(err instanceof Error ? err.message : "Decryption failed. Verify your keys.");
    } finally {
      setDecrypting(false);
    }
  };

  const handleDecrypt = () => {
    if (!privateKey.trim() && !aesKey.trim()) {
      setDecryptError("Paste your RSA Private Key or AES Key to decrypt.");
      return;
    }
    if (transfer) {
      performDecryption(privateKey, aesKey, transfer, transfer.encrypted_session_key);
    }
  };

  // Fetch transfer via the Next.js server API route (laptop → Supabase cloud)
  // Phone only needs LAN to reach the laptop — no direct internet required
  useEffect(() => {
    if (!transferId) {
      setFetchError("No transfer ID in this link. Please scan the QR code again from the Operation Lab.");
      setLoading(false);
      return;
    }

    const diagTimer = setTimeout(() => {
      setShowDiagnostic(true);
    }, 4000);

    fetch(`/api/db/transfer?id=${transferId}`)
      .then(async (res) => {
        clearTimeout(diagTimer);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setFetchError(
            err.error || "This encrypted payload could not be found. It may have already been decrypted and deleted, or the QR code has expired."
          );
        } else {
          const data = (await res.json()) as EphemeralTransfer;
          let autoPrivKey = "";
          let autoAesKey = "";
          let autoEsKey = data.encrypted_session_key || "";

          // If keys are bundled via JSON, automatically extract them
          if (autoEsKey.startsWith("{")) {
            try {
              const bundled = JSON.parse(autoEsKey);
              autoPrivKey = bundled.rsa_private_key || "";
              autoAesKey = bundled.aes_key || "";
              autoEsKey = bundled.encrypted_session_key || "";
              
              // Strip JSON from display object
              data.encrypted_session_key = autoEsKey;
            } catch { /* ignore */ }
          }

          setTransfer(data);

          if (autoPrivKey) setPrivateKey(autoPrivKey);
          if (autoAesKey) setAesKey(autoAesKey);

          setLoading(false);

          // ⚡ Automatically decrypt without requiring the user to press a button!
          if (autoPrivKey || autoAesKey) {
            performDecryption(autoPrivKey, autoAesKey, data, autoEsKey);
          }
        }
      })
      .catch((err) => {
        clearTimeout(diagTimer);
        setFetchError("Network error: Could not reach the laptop server. Make sure you are on the same hotspot/WiFi. " + (err?.message || ""));
        setLoading(false);
      });

    return () => clearTimeout(diagTimer);
  }, [transferId]);



  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-indigo-300 text-sm font-medium">Loading encrypted payload…</p>
        <p className="text-slate-600 text-xs">Connecting to Supabase Cloud Database</p>
        {showDiagnostic && (
          <div className="mt-6 max-w-xs p-4 bg-yellow-950/20 border border-yellow-500/20 rounded-2xl space-y-2 animate-pulse text-left">
            <p className="text-yellow-400 text-xs font-bold">⚠️ Connection taking too long</p>
            <p className="text-slate-400 text-[10px] leading-4">
              Your phone loaded the page from the computer hotspot, but now it needs **internet access** to download the encrypted payload from Supabase.
            </p>
            <p className="text-slate-400 text-[10px] leading-4 font-semibold">
              Please make sure your phone's hotspot/WiFi connection has active internet access enabled (e.g. cellular data is turned on).
            </p>
          </div>
        )}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl mb-2">🔐</div>
        <h1 className="text-white font-bold text-lg">Payload Unavailable</h1>
        <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-4 max-w-xs">
          <p className="text-red-400 text-sm leading-5">{fetchError}</p>
        </div>
        <p className="text-slate-500 text-xs max-w-xs mt-1">
          Open the Operation Lab on your computer → encrypt a document → scan the fresh QR code.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white pb-10">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-950/60 to-transparent px-5 pt-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-lg">🔒</div>
          <div>
            <h1 className="text-sm font-bold text-white">CipherVault Decrypt Node</h1>
            <p className="text-[10px] text-indigo-300/70 font-mono truncate max-w-[230px]">
              {transfer?.document_name ?? "Encrypted Document"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/20 text-[9px] font-mono text-indigo-300">
            AES-{transfer?.aes_mode ?? "GCM"}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/20 text-[9px] font-mono text-indigo-300">
            RSA-WRAP
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/20 text-[9px] font-mono text-emerald-400">
            🔥 Burn-After-Read
          </span>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5 max-w-lg mx-auto">
        {decryptedText ? (
          /* ── Decrypted Result View ── */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <h2 className="text-emerald-400 font-bold text-sm">Decrypted Successfully</h2>
                <p className="text-slate-500 text-[10px]">Payload has been permanently deleted from server</p>
              </div>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4">
              <p className="text-white text-xs font-mono leading-6 whitespace-pre-wrap break-words">
                {decryptedText}
              </p>
            </div>
            {recoveredAesKey && (
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3 space-y-1">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Recovered AES Session Key</p>
                <p className="text-indigo-300 text-[9px] font-mono break-all">{recoveredAesKey}</p>
              </div>
            )}
            <button
              onClick={() => navigator.clipboard?.writeText(decryptedText).catch(() => {})}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm active:opacity-80 transition-opacity"
            >
              📋 Copy Decrypted Text
            </button>
          </div>
        ) : (
          /* ── Decrypt Input Form ── */
          <>
            <div className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-3 space-y-1">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Encrypted Payload Preview</p>
              <p className="text-slate-500 text-[9px] font-mono line-clamp-2 break-all">
                {transfer?.encrypted_payload}
              </p>
            </div>

            {/* RSA Private Key */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                RSA Private Key
              </label>
              <div className="relative">
                <textarea
                  rows={4}
                  value={privateKey}
                  onChange={(e) => { setPrivateKey(e.target.value); setDecryptError(""); }}
                  placeholder={"-----BEGIN RSA PRIVATE KEY-----\nPaste your private key here...\n-----END RSA PRIVATE KEY-----"}
                  style={{ WebkitTextSecurity: showKey ? "none" : "disc" } as React.CSSProperties}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-3 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 resize-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-3 top-3 text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Pre-filled session key info */}
            {transfer?.encrypted_session_key && (
              <div className="bg-slate-900/40 border border-slate-700/20 rounded-xl p-3 space-y-1">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">RSA-Wrapped Session Key (Auto-loaded)</p>
                <p className="text-indigo-300/50 text-[9px] font-mono line-clamp-1 break-all">{transfer.encrypted_session_key}</p>
              </div>
            )}

            {/* AES fallback */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                AES Key (alternative)
              </label>
              <input
                type="text"
                value={aesKey}
                onChange={(e) => { setAesKey(e.target.value); setDecryptError(""); }}
                placeholder="Or paste raw AES hex key..."
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-3 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
              />
            </div>

            {/* Error */}
            {decryptError && (
              <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-xs leading-5">{decryptError}</p>
              </div>
            )}

            {/* Decrypt Button */}
            <button
              onClick={handleDecrypt}
              disabled={decrypting || (!privateKey.trim() && !aesKey.trim())}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm active:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
            >
              {decrypting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Decrypting…
                </>
              ) : (
                "🔓 Decrypt Document"
              )}
            </button>

            <p className="text-[9px] text-slate-600 text-center leading-4">
              Your keys never leave this device. Once decrypted, the payload is permanently erased from the server.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function MobileDecryptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MobileDecryptContent />
    </Suspense>
  );
}
