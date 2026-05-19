import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface EmailQuery {
  folder?: "inbox" | "sent" | "draft" | "trash";
  skip?: number;
  limit?: number;
  search?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const folder = (url.searchParams.get("folder") || "inbox") as "inbox" | "sent" | "draft" | "trash";
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";

    // TODO: Implement actual email retrieval from Supabase
    // const supabase = createClient(...);
    // const user = await supabase
    //   .from('users')
    //   .select('id')
    //   .eq('clerk_id', userId)
    //   .single();
    // 
    // let query = supabase
    //   .from('emails')
    //   .select('*')
    //   .eq('recipient_id', user.id)
    //   .eq('folder', folder);
    //
    // if (search) {
    //   query = query.or(`subject.ilike.%${search}%,body_encrypted.ilike.%${search}%`);
    // }
    //
    // const { data: emails, error } = await query
    //   .range(skip, skip + limit - 1)
    //   .order('created_at', { ascending: false });

    // Mock data for now
    const mockEmails = [
      {
        id: "1",
        from: "alice@example.com",
        subject: "Project Update",
        preview: "[Encrypted Message]",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
        isEncrypted: true,
        hasAttachments: false,
      },
      {
        id: "2",
        from: "bob@secure.org",
        subject: "Keys renewed",
        preview: "[Encrypted Message]",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        isRead: true,
        isEncrypted: true,
        hasAttachments: false,
      },
      {
        id: "3",
        from: "marketing@example.com",
        subject: "Last chance to save!",
        preview: "[Encrypted Message]",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        isRead: true,
        isEncrypted: true,
        hasAttachments: true,
      },
    ];

    // Filter by search if provided
    const filtered = search
      ? mockEmails.filter(
          (email) =>
            email.subject.toLowerCase().includes(search.toLowerCase()) ||
            email.from.toLowerCase().includes(search.toLowerCase())
        )
      : mockEmails;

    // Apply pagination
    const paginated = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      emails: paginated,
      total: filtered.length,
      skip,
      limit,
      folder,
      message: "Using mock data. Connect to Supabase for real emails."
    });
  } catch (error) {
    console.error("Email fetch error:", error);
    return NextResponse.json(
      { error: "Email fetch failed", details: String(error) },
      { status: 500 }
    );
  }
}
