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

    const { to, subject, body, recipientPublicKey } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing email fields (to, subject, body)" },
        { status: 400 }
      );
    }

    if (!recipientPublicKey) {
      return NextResponse.json(
        { error: "Recipient public key required" },
        { status: 400 }
      );
    }

    // Generate random 256-bit AES key
    const aesKey = crypto.randomBytes(32);

    // Encrypt email body with AES-256-GCM
    const encryption = encryptAES(body, aesKey);

    // Encrypt AES key with recipient's RSA public key
    const encryptedAesKey = encryptWithRSA(aesKey, recipientPublicKey);

    // TODO: Store in Supabase database
    // await supabase
    //   .from('emails')
    //   .insert({
    //     sender_id: userId,
    //     recipient_id: recipient.id,
    //     subject,
    //     body_encrypted: encryption.ciphertext,
    //     aes_key_encrypted: encryptedAesKey,
    //     iv: encryption.iv,
    //     auth_tag: encryption.authTag,
    //     folder: 'inbox',
    //     is_read: false
    //   });

    return NextResponse.json({
      emailId: crypto.randomUUID?.() || `email_${Date.now()}`,
      status: "encrypted",
      to,
      subject,
      encryptedData: {
        bodyEncrypted: encryption.ciphertext,
        aesKeyEncrypted: encryptedAesKey,
        iv: encryption.iv,
        authTag: encryption.authTag,
      },
      timestamp: new Date(),
      message: "Email encrypted successfully. Ready to send."
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Email send failed", details: String(error) },
      { status: 500 }
    );
  }
}
