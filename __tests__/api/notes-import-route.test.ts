import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/embeddings", () => ({
  storeNoteEmbedding: vi.fn().mockResolvedValue(undefined),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeNoteEmbedding } from "@/lib/embeddings";
import { MAX_IMPORT_BYTES } from "@/lib/note-io";
import { POST } from "@/app/api/notes/import/route";

const mockAuth = vi.mocked(auth);
const mockCreate = vi.mocked(prisma.note.create);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockStoreNoteEmbedding = vi.mocked(storeNoteEmbedding);

const IMPORT_URL = "http://localhost/api/notes/import";

function jsonImportRequest(data: string, format = "json") {
  return new Request(IMPORT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, data }),
  });
}

function multipartImportRequest(opts: {
  file?: File;
  format?: string;
}) {
  const form = new FormData();
  if (opts.format) form.append("format", opts.format);
  if (opts.file) form.append("file", opts.file);
  return new Request(IMPORT_URL, { method: "POST", body: form });
}

describe("notes import API route — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockTransaction.mockResolvedValue([
      { id: "n1", title: "导入笔记", content: "正文" },
    ] as never);
    mockCreate.mockResolvedValue({
      id: "n1",
      title: "导入笔记",
      content: "正文",
    } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(jsonImportRequest("{}"));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns 400 when multipart request has no file", async () => {
    const res = await POST(multipartImportRequest({ format: "json" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("请上传文件");
  });

  it("returns 400 when parsed notes array is empty", async () => {
    const res = await POST(
      jsonImportRequest(JSON.stringify({ version: 1, notes: [] }))
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("没有可导入的笔记");
  });

  it("imports notes from JSON body and stores embeddings", async () => {
    const payload = {
      version: 1,
      notes: [
        {
          title: "导入笔记",
          content: "正文",
          tags: ["学习"],
          published: false,
        },
      ],
    };

    const res = await POST(jsonImportRequest(JSON.stringify(payload)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imported).toBe(1);
    expect(data.noteIds).toEqual(["n1"]);
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "导入笔记",
        content: "正文",
        summary: null,
        tags: ["学习"],
        published: false,
        userId: "user-1",
      },
      select: { id: true, title: true, content: true },
    });
    expect(mockStoreNoteEmbedding).toHaveBeenCalledWith(
      "n1",
      "导入笔记\n正文"
    );
  });

  it("imports notes from multipart markdown upload", async () => {
    const markdown = [
      "---",
      "title: Markdown 笔记",
      "tags: [\"标签\"]",
      "---",
      "",
      "Markdown 正文",
    ].join("\n");
    const file = new File([markdown], "notes.md", { type: "text/markdown" });

    const res = await POST(
      multipartImportRequest({ file, format: "markdown" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imported).toBe(1);
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Markdown 笔记",
        content: "Markdown 正文",
        tags: ["标签"],
        userId: "user-1",
      }),
      select: { id: true, title: true, content: true },
    });
  });

  it("returns 400 when import payload exceeds size limit", async () => {
    const oversized = "x".repeat(MAX_IMPORT_BYTES + 1);
    const res = await POST(jsonImportRequest(oversized));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("导入文件不能超过 5MB");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid JSON data", async () => {
    const res = await POST(jsonImportRequest("not-valid-json"));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});