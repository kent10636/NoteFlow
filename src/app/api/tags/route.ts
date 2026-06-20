import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aggregateTags, mergeTagsInNotes, renameTagInNotes } from "@/lib/tags";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    select: { tags: true },
  });

  return NextResponse.json({ tags: aggregateTags(notes) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action as "rename" | "merge";

    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      select: { id: true, tags: true },
    });

    let updates: { id: string; tags: string[] }[] = [];

    if (action === "rename") {
      const { from, to } = body;
      if (!from?.trim() || !to?.trim()) {
        return NextResponse.json({ error: "请提供原标签和新标签" }, { status: 400 });
      }
      updates = renameTagInNotes(notes, from, to);
    } else if (action === "merge") {
      const { sources, target } = body;
      if (!Array.isArray(sources) || !target?.trim()) {
        return NextResponse.json({ error: "请提供要合并的标签" }, { status: 400 });
      }
      updates = mergeTagsInNotes(notes, sources, target);
    } else {
      return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
    }

    await prisma.$transaction(
      updates.map((item) =>
        prisma.note.update({
          where: { id: item.id },
          data: { tags: item.tags },
        })
      )
    );

    const refreshed = await prisma.note.findMany({
      where: { userId: session.user.id },
      select: { tags: true },
    });

    return NextResponse.json({
      updated: updates.length,
      tags: aggregateTags(refreshed),
    });
  } catch (error) {
    console.error("Tag update error:", error);
    return NextResponse.json({ error: "标签更新失败" }, { status: 500 });
  }
}