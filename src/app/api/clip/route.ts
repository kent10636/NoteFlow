import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserFromClipToken } from "@/lib/clip-auth";
import { buildClippedNote } from "@/lib/clip-note";
import { storeNoteEmbedding } from "@/lib/embeddings";

export async function POST(request: Request) {
  const userId = await resolveUserFromClipToken(
    request.headers.get("authorization")
  );

  if (!userId) {
    return NextResponse.json({ error: "无效的剪藏令牌" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const clipped = buildClippedNote(body);

    const note = await prisma.note.create({
      data: {
        title: clipped.title,
        content: clipped.content,
        tags: clipped.tags,
        userId,
      },
    });

    storeNoteEmbedding(note.id, `${note.title}\n${note.content}`).catch(
      console.error
    );

    return NextResponse.json({
      id: note.id,
      title: note.title,
      url: `/dashboard/notes/${note.id}`,
    });
  } catch (error) {
    console.error("Clip error:", error);
    return NextResponse.json({ error: "剪藏失败" }, { status: 500 });
  }
}