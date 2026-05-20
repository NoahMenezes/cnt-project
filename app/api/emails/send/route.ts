import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { encryptAES, encryptWithRSA } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Encrypt email body with AES-256-GCM and wrap the key with RSA-2048
    const aesKey = crypto.randomBytes(32);
    const encryption = encryptAES(body, aesKey);
    const encryptedAesKey = encryptWithRSA(aesKey, recipientPublicKey);

    // Look up sender in Supabase
    const { data: sender } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    // Look up recipient by email in Supabase
    const { data: recipient } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", to)
      .single();

    let emailId = crypto.randomUUID?.() ?? `email_${Date.now()}`;
    let persisted = false;

    if (sender && recipient) {
      const { data: stored, error: insertError } = await supabaseAdmin
        .from("emails")
        .insert({
          sender_id: sender.id,
          recipient_id: recipient.id,
          subject,
          body_encrypted: encryption.ciphertext,
          aes_key_encrypted: encryptedAesKey,
          iv: encryption.iv,
          auth_tag: encryption.authTag,
          folder: "inbox",
          is_read: false,
        })
        .select("id")
        .single();

      if (stored) {
        emailId = stored.id;
        persisted = true;
      }
      if (insertError) {
        console.warn("Supabase insert warning:", insertError.message);
      }
    } else {
      console.warn(
        `Recipient '${to}' not found in Supabase — email not persisted.`
      );
    }

    return NextResponse.json({
      emailId,
      status: "encrypted",
      to,
      subject,
      persisted,
      encryptedData: {
        bodyEncrypted: encryption.ciphertext,
        aesKeyEncrypted: encryptedAesKey,
        iv: encryption.iv,
        authTag: encryption.authTag,
      },
      timestamp: new Date(),
      message: persisted
        ? "Email encrypted and stored successfully."
        : `Email encrypted. Recipient '${to}' not found in system — message not persisted.`,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Email send failed", details: String(error) },
      { status: 500 }
    );
  }
}
