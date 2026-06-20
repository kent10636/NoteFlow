import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findRelatedNotes } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { noteId } = await request.json();

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: session.user.id },
    });

    if (!note) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    }

    const otherNotes = await prisma.note.findMany({
      where: { userId: session.user.id, id: { not: noteId } },
      select: { id: true, title: true, content: true, summary: true, tags: true },
      take: 50,
    });

    const related = await findRelatedNotes(note.content, otherNotes);

    // Store links in knowledge graph
    for (const rel of related) {
      await prisma.noteLink.upsert({
        where: {
          fromNoteId_toNoteId: { fromNoteId: noteId, toNoteId: rel.id },
        },
        create: {
          fromNoteId: noteId,
          toNoteId: rel.id,
          strength: 0.8,
        },
        update: { strength: 0.8 },
      });
    }

    const recommendations = otherNotes
      .filter((n) => related.some((r) => r.id === n.id))
      .map((n) => ({
        ...n,
        reason: related.find((r) => r.id === n.id)?.reason ?? "",
      }));

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json({ error: "推荐失败" }, { status: 500 });
  }
}