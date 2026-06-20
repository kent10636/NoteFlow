import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true, tags: true },
  });

  const links = await prisma.noteLink.findMany({
    where: {
      fromNote: { userId: session.user.id },
    },
    select: {
      id: true,
      fromNoteId: true,
      toNoteId: true,
      strength: true,
    },
  });

  const nodes = notes.map((note) => ({
    id: note.id,
    label: note.title,
    tags: note.tags,
  }));

  const edges = links.map((link) => ({
    id: link.id,
    source: link.fromNoteId,
    target: link.toNoteId,
    strength: link.strength,
  }));

  return NextResponse.json({ nodes, edges });
}