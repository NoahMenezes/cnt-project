import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      deviceId,
      encryptedPayload,
      encryptedSessionKey,
      aesIV,
      aesMode,
      documentName,
    } = body as {
      deviceId: string;
      encryptedPayload: string;
      encryptedSessionKey: string;
      aesIV: string;
      aesMode: string;
      documentName: string;
    };

    if (!deviceId || !encryptedPayload) {
      return NextResponse.json(
        { error: "Missing required fields: deviceId and encryptedPayload." },
        { status: 400 }
      );
    }

    // Verify device exists
    const { data: device, error: devErr } = await supabase
      .from("user_devices")
      .select("id, device_name")
      .eq("id", deviceId)
      .single();

    if (devErr || !device) {
      return NextResponse.json(
        { error: "Device not found. Please verify the device ID." },
        { status: 404 }
      );
    }

    // Insert the ephemeral transfer
    const { data, error } = await supabase
      .from("ephemeral_transfers")
      .insert({
        device_id: deviceId,
        encrypted_payload: encryptedPayload,
        encrypted_session_key: encryptedSessionKey ?? "",
        aes_iv: aesIV ?? "",
        aes_mode: aesMode ?? "GCM",
        document_name: documentName ?? "Encrypted Document",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transferId: data.id,
      deviceName: device.device_name,
      message: `Payload sent to "${device.device_name}" successfully.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
