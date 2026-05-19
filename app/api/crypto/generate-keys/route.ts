import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { generateRSAKeyPair, generateFingerprint } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate RSA-2048 keypair
    const { publicKey, privateKey } = await generateRSAKeyPair();
    
    // Generate fingerprint
    const fingerprint = generateFingerprint(publicKey);

    // TODO: Store in Supabase database
    // For now, we're returning the keys in the response
    // In production, store only public key and encrypted private key in DB

    return NextResponse.json({
      publicKey,
      privateKeyEncrypted: privateKey,
      fingerprint,
      userId,
      timestamp: new Date(),
      message: "Keys generated successfully. Store privateKeyEncrypted securely."
    });
  } catch (error) {
    console.error("Key generation error:", error);
    return NextResponse.json(
      { error: "Key generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
