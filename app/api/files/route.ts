import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { filename, receiverId, encryptedKey, iv, encryptedFileUrl } = await req.json();

    const file = await prisma.file.create({
        data: {
            filename,
            senderId: userId,
            receiverId,
            encryptedKey,
            iv,
            encryptedFileUrl,
        },
    });

    return NextResponse.json(file);
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const files = await prisma.file.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        include: {
            sender: { select: { clerkId: true } },
            receiver: { select: { clerkId: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(files);
}
