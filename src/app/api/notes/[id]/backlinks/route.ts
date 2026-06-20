import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBacklinks } from "@/lib/backlinks";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;

  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!note) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }

  const backlinks = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      linksFrom: { some: { toNoteId: id } },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ backlinks: formatBacklinks(backlinks) });
}