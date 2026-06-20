import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeNoteEmbedding } from "@/lib/embeddings";
import {
  parseNotesFromJson,
  parseNotesFromMarkdown,
  sanitizeImportPayloadSize,
} from "@/lib/note-io";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let format = "json";
    let rawData = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      format = String(form.get("format") ?? "json");
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "请上传文件" }, { status: 400 });
      }
      sanitizeImportPayloadSize(file.size);
      rawData = await file.text();
    } else {
      const body = await request.json();
      format = body.format ?? "json";
      rawData = body.data ?? "";
      sanitizeImportPayloadSize(new TextEncoder().encode(String(rawData)).length);
    }

    const parsed =
      format === "markdown"
        ? parseNotesFromMarkdown(rawData)
        : parseNotesFromJson(JSON.parse(rawData));

    if (parsed.length === 0) {
      return NextResponse.json({ error: "没有可导入的笔记" }, { status: 400 });
    }

    const created = await prisma.$transaction(
      parsed.map((note) =>
        prisma.note.create({
          data: {
            title: note.title,
            content: note.content,
            summary: note.summary,
            tags: note.tags,
            published: note.published,
            userId: session.user!.id,
          },
          select: { id: true, title: true, content: true },
        })
      )
    );

    for (const note of created) {
      storeNoteEmbedding(note.id, `${note.title}\n${note.content}`).catch(
        console.error
      );
    }

    return NextResponse.json({
      imported: created.length,
      noteIds: created.map((note) => note.id),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "导入失败，请检查文件格式";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}