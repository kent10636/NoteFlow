import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  serializeNotesToJson,
  serializeNotesToMarkdown,
} from "@/lib/note-io";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      title: true,
      content: true,
      summary: true,
      tags: true,
      published: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const records = notes.map((note) => ({
    title: note.title,
    content: note.content,
    summary: note.summary,
    tags: note.tags,
    published: note.published,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }));

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "markdown") {
    const markdown = serializeNotesToMarkdown(records);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="noteflow-export-${stamp}.md"`,
      },
    });
  }

  const payload = serializeNotesToJson(records);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="noteflow-export-${stamp}.json"`,
    },
  });
}