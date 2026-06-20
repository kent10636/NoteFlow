import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeNoteEmbedding } from "@/lib/embeddings";
import { syncNoteLinks } from "@/lib/wikilink";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;

  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }

  return NextResponse.json(note);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    }

    const { title, content, summary, tags, published } = await request.json();

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary }),
        ...(tags !== undefined && { tags }),
        ...(published !== undefined && { published }),
      },
    });

    await syncNoteLinks(session.user.id, note.id, note.content, prisma);

    storeNoteEmbedding(note.id, `${note.title}\n${note.content}`).catch(
      console.error
    );

    return NextResponse.json(note);
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json({ error: "更新笔记失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ success: true });
}