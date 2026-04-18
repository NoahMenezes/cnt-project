import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { publicKey } = await req.json();

    const user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: { publicKey },
        create: { clerkId: userId, publicKey },
    });

    return NextResponse.json(user);
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    return NextResponse.json(user);
}
