import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { generateRSAKeyPair, generateFingerprint } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate RSA-2048 keypair
    const { publicKey, privateKey } = await generateRSAKeyPair();
    const fingerprint = generateFingerprint(publicKey);

    // Fetch Clerk user profile for email + name
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
    const name = clerkUser?.fullName ?? "";

    // Persist public key + AES-encrypted private key to Supabase
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          clerk_id: userId,
          email,
          name,
          public_key: publicKey,
          private_key_encrypted: privateKey, // AES-256-CBC encrypted PEM
          key_fingerprint: fingerprint,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clerk_id" }
      );

    if (dbError) {
      console.warn("Supabase upsert warning:", dbError.message);
      // Non-fatal: still return keys so client can cache locally
    }

    // Return public key + encrypted private key for one-time client-side storage.
    // The private key is AES-256-CBC encrypted with ENCRYPTION_PASSPHRASE.
    // It will NOT be re-transmitted after this point — store it securely.
    return NextResponse.json({
      publicKey,
      encryptedPrivateKey: privateKey,
      fingerprint,
      userId,
      storedInDb: !dbError,
      timestamp: new Date(),
      warning:
        "Store encryptedPrivateKey securely on your device. It will not be retrievable from the server.",
    });
  } catch (error) {
    console.error("Key generation error:", error);
    return NextResponse.json(
      { error: "Key generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
