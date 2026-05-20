import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const folder = (url.searchParams.get("folder") || "inbox") as
      | "inbox"
      | "sent"
      | "draft"
      | "trash";
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";

    // Look up user record in Supabase
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !dbUser) {
      // User hasn't generated keys yet — return empty inbox
      return NextResponse.json({ emails: [], total: 0, skip, limit, folder });
    }

    // For "sent" folder filter by sender_id, otherwise by recipient_id
    const idColumn = folder === "sent" ? "sender_id" : "recipient_id";

    let query = supabaseAdmin
      .from("emails")
      .select(
        `id, subject, is_read, created_at, folder,
         sender:users!sender_id ( email, name )`
      )
      .eq(idColumn, dbUser.id)
      .eq("folder", folder);

    if (search) {
      query = query.ilike("subject", `%${search}%`);
    }

    const { data: emails, error: emailsError } = await query
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (emailsError) {
      console.error("Supabase email fetch error:", emailsError);
      return NextResponse.json(
        { error: "Email fetch failed" },
        { status: 500 }
      );
    }

    // Shape into the EmailItem interface expected by the frontend
    const shaped = (emails ?? []).map((e: any) => ({
      id: e.id,
      from: e.sender?.email ?? "unknown@secureemail.com",
      subject: e.subject,
      preview: "[Encrypted — click to decrypt]",
      timestamp: new Date(e.created_at).toLocaleString(),
      isRead: e.is_read,
      isEncrypted: true,
      hasAttachments: false,
    }));

    return NextResponse.json({
      emails: shaped,
      total: shaped.length,
      skip,
      limit,
      folder,
    });
  } catch (error) {
    console.error("Email fetch error:", error);
    return NextResponse.json(
      { error: "Email fetch failed", details: String(error) },
      { status: 500 }
    );
  }
}
