import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { receiverId, content, encryptedKey, iv } = await req.json();

    const msg = await prisma.message.create({
        data: {
            senderId: userId,
            receiverId,
            content,
            encryptedKey,
            iv,
        },
    });

    return NextResponse.json(msg);
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const messages = await prisma.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        include: {
            sender: { select: { clerkId: true } },
            receiver: { select: { clerkId: true } },
        },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
}
