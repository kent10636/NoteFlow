import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTags } from "@/lib/ai";

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

    const newTags = await generateTags(note.content);
    const mergedTags = [...new Set([...note.tags, ...newTags])];

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { tags: mergedTags },
    });

    return NextResponse.json({ tags: updated.tags });
  } catch (error) {
    console.error("Tags error:", error);
    return NextResponse.json({ error: "生成标签失败" }, { status: 500 });
  }
}