import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeNoteEmbedding } from "@/lib/embeddings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
      tags: true,
      published: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { title, content, tags, published } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content || "",
        tags: tags || [],
        published: published ?? false,
        userId: session.user.id,
      },
    });

    // Generate embedding asynchronously
    storeNoteEmbedding(note.id, `${note.title}\n${note.content}`).catch(
      console.error
    );

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json({ error: "创建笔记失败" }, { status: 500 });
  }
}