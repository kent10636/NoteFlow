import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BATCH = 100;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { action, noteIds, tags } = await request.json();

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json({ error: "请选择笔记" }, { status: 400 });
    }

    if (noteIds.length > MAX_BATCH) {
      return NextResponse.json(
        { error: `单次最多操作 ${MAX_BATCH} 条笔记` },
        { status: 400 }
      );
    }

    const owned = await prisma.note.findMany({
      where: { userId: session.user.id, id: { in: noteIds } },
      select: { id: true, tags: true },
    });

    if (owned.length === 0) {
      return NextResponse.json({ error: "未找到可操作的笔记" }, { status: 404 });
    }

    if (action === "delete") {
      await prisma.note.deleteMany({
        where: { userId: session.user.id, id: { in: owned.map((n) => n.id) } },
      });
      return NextResponse.json({ affected: owned.length });
    }

    if (action === "addTags") {
      if (!Array.isArray(tags) || tags.length === 0) {
        return NextResponse.json({ error: "请提供标签" }, { status: 400 });
      }
      const newTags = tags.map((t: string) => t.trim()).filter(Boolean);

      await prisma.$transaction(
        owned.map((note) =>
          prisma.note.update({
            where: { id: note.id },
            data: { tags: [...new Set([...note.tags, ...newTags])] },
          })
        )
      );
      return NextResponse.json({ affected: owned.length });
    }

    if (action === "removeTags") {
      if (!Array.isArray(tags) || tags.length === 0) {
        return NextResponse.json({ error: "请提供标签" }, { status: 400 });
      }
      const removeSet = new Set(tags.map((t: string) => t.trim()).filter(Boolean));

      await prisma.$transaction(
        owned.map((note) =>
          prisma.note.update({
            where: { id: note.id },
            data: {
              tags: note.tags.filter((tag) => !removeSet.has(tag)),
            },
          })
        )
      );
      return NextResponse.json({ affected: owned.length });
    }

    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  } catch (error) {
    console.error("Batch note error:", error);
    return NextResponse.json({ error: "批量操作失败" }, { status: 500 });
  }
}