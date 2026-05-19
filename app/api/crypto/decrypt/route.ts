import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { decryptAES, decryptWithRSA } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { ciphertext, encryptedAesKey, iv, authTag, privateKey, passphrase } =
      await request.json();

    if (!ciphertext || !encryptedAesKey || !iv || !authTag || !privateKey) {
      return NextResponse.json(
        { error: "Missing encryption parameters (ciphertext, encryptedAesKey, iv, authTag, privateKey)" },
        { status: 400 }
      );
    }

    try {
      // Decrypt AES key using RSA private key
      const decryptedAesKeyBuffer = decryptWithRSA(encryptedAesKey, privateKey, passphrase);

      // Decrypt ciphertext using AES key
      const result = decryptAES(
        ciphertext,
        decryptedAesKeyBuffer,
        Buffer.from(iv, "hex"),
        Buffer.from(authTag, "hex")
      );

      return NextResponse.json({
        plaintext: result.plaintext,
        timestamp: new Date(),
        message: "Decryption successful"
      });
    } catch (cryptoError) {
      console.error("Decryption error:", cryptoError);
      return NextResponse.json(
        { error: "Decryption failed", details: String(cryptoError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Decryption request failed" },
      { status: 500 }
    );
  }
}
