import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/db/device?userId=xxx — fetch or auto-create a device for user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "default-local-user";

  const { data, error } = await supabase
    .from("user_devices")
    .select("id, device_name")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data && data.length > 0) {
    return NextResponse.json(data[0]);
  }

  // Auto-create a default device
  const { data: newDev, error: createError } = await supabase
    .from("user_devices")
    .insert({ user_id: userId, device_name: "Direct Sync Device", public_key: "pending" })
    .select()
    .single();

  if (createError || !newDev) {
    return NextResponse.json({ error: createError?.message ?? "Failed to create device" }, { status: 500 });
  }

  return NextResponse.json(newDev);
}
