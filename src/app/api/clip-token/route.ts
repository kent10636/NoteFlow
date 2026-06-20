import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClipToken } from "@/lib/clip-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clipToken: true },
  });

  return NextResponse.json({
    configured: !!user?.clipToken,
    token: user?.clipToken ?? null,
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const token = generateClipToken();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { clipToken: token },
  });

  return NextResponse.json({ token });
}