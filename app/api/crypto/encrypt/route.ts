import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { encryptAES, encryptWithRSA } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { plaintext, recipientPublicKey } = await request.json();

    if (!plaintext || !recipientPublicKey) {
      return NextResponse.json(
        { error: "Missing plaintext or public key" },
        { status: 400 }
      );
    }

    try {
      // Generate random 256-bit AES key
      const aesKey = crypto.randomBytes(32);

      // Encrypt plaintext with AES-256-GCM
      const encryption = encryptAES(plaintext, aesKey);

      // Encrypt AES key with recipient's RSA public key
      const encryptedAesKey = encryptWithRSA(aesKey, recipientPublicKey);

      return NextResponse.json({
        ciphertext: encryption.ciphertext,
        encryptedAesKey: encryptedAesKey,
        iv: encryption.iv,
        authTag: encryption.authTag,
        timestamp: new Date(),
        message: "Text encrypted successfully with hybrid encryption"
      });
    } catch (cryptoError) {
      console.error("Encryption error:", cryptoError);
      return NextResponse.json(
        { error: "Encryption failed", details: String(cryptoError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Encryption request failed" },
      { status: 500 }
    );
  }
}
