import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side client using service role key — bypasses RLS for reliable reads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/db/transfer?id=xxx
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing transfer ID" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ephemeral_transfers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Transfer not found or already deleted." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/db/transfer?id=xxx  — burn after reading
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing transfer ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ephemeral_transfers")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// POST /api/db/transfer — insert new ephemeral transfer
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("ephemeral_transfers")
    .insert(body)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
