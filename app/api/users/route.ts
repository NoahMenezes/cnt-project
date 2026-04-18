import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // In a real app we might use Clerk's user list, but Prisma metadata works too.
    const users = await prisma.user.findMany({
        where: {
            clerkId: { not: userId }
        },
        select: {
            clerkId: true,
            publicKey: true,
        }
    });

    return NextResponse.json(users);
}
