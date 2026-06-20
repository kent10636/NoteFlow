import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/ai";

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

    const summary = await generateSummary(note.content);

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { summary },
    });

    return NextResponse.json({ summary: updated.summary });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ error: "生成摘要失败" }, { status: 500 });
  }
}