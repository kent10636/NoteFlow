import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processFileOcr } from "@/lib/ocr";
import { storeNoteEmbedding } from "@/lib/embeddings";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const noteId = formData.get("noteId") as string | null;
    const createNote = formData.get("createNote") === "true";

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 JPG、PNG、WebP、GIF 和 PDF 文件" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ocrText = await processFileOcr(buffer, file.type);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      session.user.id
    );
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${session.user.id}/${safeName}`;

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        ocrText: ocrText || null,
        noteId: noteId || null,
        userId: session.user.id,
      },
    });

    let note = null;
    if (createNote && ocrText) {
      note = await prisma.note.create({
        data: {
          title: `📎 ${file.name}`,
          content: `## 附件: ${file.name}\n\n${ocrText}`,
          tags: ["上传", file.type.startsWith("image/") ? "图片" : "PDF"],
          userId: session.user.id,
        },
      });

      await prisma.attachment.update({
        where: { id: attachment.id },
        data: { noteId: note.id },
      });

      storeNoteEmbedding(note.id, `${note.title}\n${note.content}`).catch(
        console.error
      );
    }

    return NextResponse.json({
      attachment,
      note,
      ocrText,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}