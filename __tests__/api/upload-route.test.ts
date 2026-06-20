import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  rateLimitKey: vi.fn(() => "upload:key"),
  RATE_LIMITS: { upload: { limit: 10, windowMs: 600000 } },
}));
vi.mock("@/lib/storage", () => ({
  isUploadStorageReady: vi.fn(),
  storeUploadedFile: vi.fn(),
}));
vi.mock("@/lib/ocr", () => ({ processFileOcr: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    attachment: { create: vi.fn(), update: vi.fn() },
    note: { create: vi.fn() },
  },
}));
vi.mock("@/lib/embeddings", () => ({ storeNoteEmbedding: vi.fn() }));

import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isUploadStorageReady, storeUploadedFile } from "@/lib/storage";
import { processFileOcr } from "@/lib/ocr";
import { prisma } from "@/lib/prisma";
import { storeNoteEmbedding } from "@/lib/embeddings";
import { POST } from "@/app/api/upload/route";

const mockAuth = vi.mocked(auth);
const mockRateLimit = vi.mocked(checkRateLimit);
const mockStorageReady = vi.mocked(isUploadStorageReady);
const mockStoreFile = vi.mocked(storeUploadedFile);
const mockOcr = vi.mocked(processFileOcr);
const mockAttachmentCreate = vi.mocked(prisma.attachment.create);
const mockAttachmentUpdate = vi.mocked(prisma.attachment.update);
const mockNoteCreate = vi.mocked(prisma.note.create);
const mockStoreEmbedding = vi.mocked(storeNoteEmbedding);

const TEN_MB = 10 * 1024 * 1024;

function uploadRequest(opts: { file?: File; noteId?: string; createNote?: boolean }) {
  const form = new FormData();
  if (opts.file) form.append("file", opts.file);
  if (opts.noteId) form.append("noteId", opts.noteId);
  if (opts.createNote) form.append("createNote", "true");
  return new Request("http://localhost/api/upload", { method: "POST", body: form });
}

function makeFile(name: string, type: string, sizeBytes: number) {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

function setupHappyPath() {
  mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  mockRateLimit.mockResolvedValue({
    allowed: true,
    remaining: 9,
    retryAfter: 0,
  });
  mockStorageReady.mockReturnValue(true);
  mockOcr.mockResolvedValue("extracted text");
  mockStoreFile.mockResolvedValue({ url: "https://cdn.example.com/photo.png" });
  mockAttachmentCreate.mockResolvedValue({
    id: "att-1",
    fileName: "photo.png",
    mimeType: "image/png",
    size: 1024,
    url: "https://cdn.example.com/photo.png",
    ocrText: "extracted text",
    noteId: null,
    userId: "user-1",
  } as never);
}

describe("upload API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHappyPath();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(uploadRequest({ file: makeFile("a.png", "image/png", 100) }));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfter: 600,
    });

    const res = await POST(uploadRequest({ file: makeFile("a.png", "image/png", 100) }));

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe("上传过于频繁，请 10 分钟后再试");
    expect(res.headers.get("Retry-After")).toBe("600");
  });

  it("returns 503 when upload storage is not ready", async () => {
    mockStorageReady.mockReturnValue(false);

    const res = await POST(uploadRequest({ file: makeFile("a.png", "image/png", 100) }));

    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("文件存储未配置，请联系管理员");
  });

  it("returns 400 when no file is provided", async () => {
    const res = await POST(uploadRequest({}));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("请选择文件");
  });

  it("returns 400 for invalid mime type", async () => {
    const res = await POST(
      uploadRequest({ file: makeFile("doc.txt", "text/plain", 100) })
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("仅支持 JPG、PNG、WebP、GIF 和 PDF 文件");
  });

  it("returns 400 when file exceeds 10MB", async () => {
    const res = await POST(
      uploadRequest({ file: makeFile("big.png", "image/png", TEN_MB + 1) })
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("文件大小不能超过 10MB");
  });

  it("returns 200 with attachment only when createNote is not set", async () => {
    const file = makeFile("photo.png", "image/png", 1024);
    const res = await POST(uploadRequest({ file }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.attachment).toMatchObject({
      id: "att-1",
      fileName: "photo.png",
      noteId: null,
    });
    expect(data.note).toBeNull();
    expect(data.ocrText).toBe("extracted text");

    expect(mockStoreFile).toHaveBeenCalledWith({
      userId: "user-1",
      fileName: "photo.png",
      mimeType: "image/png",
      buffer: expect.any(Buffer),
    });
    expect(mockAttachmentCreate).toHaveBeenCalledWith({
      data: {
        fileName: "photo.png",
        mimeType: "image/png",
        size: 1024,
        url: "https://cdn.example.com/photo.png",
        ocrText: "extracted text",
        noteId: null,
        userId: "user-1",
      },
    });
    expect(mockNoteCreate).not.toHaveBeenCalled();
    expect(mockAttachmentUpdate).not.toHaveBeenCalled();
    expect(mockStoreEmbedding).not.toHaveBeenCalled();
  });

  it("accepts all allowed mime types", async () => {
    const allowed = [
      ["photo.jpg", "image/jpeg"],
      ["photo.png", "image/png"],
      ["photo.webp", "image/webp"],
      ["anim.gif", "image/gif"],
      ["doc.pdf", "application/pdf"],
    ] as const;

    for (const [name, type] of allowed) {
      vi.clearAllMocks();
      setupHappyPath();
      mockAttachmentCreate.mockResolvedValue({
        id: "att-1",
        fileName: name,
        mimeType: type,
        noteId: null,
      } as never);

      const res = await POST(
        uploadRequest({ file: makeFile(name, type, 100) })
      );

      expect(res.status).toBe(200);
    }
  });

  it("auto-creates note when createNote=true", async () => {
    const file = makeFile("report.pdf", "application/pdf", 2048);
    mockNoteCreate.mockResolvedValue({
      id: "note-1",
      title: "report",
      content: "## 附件: report.pdf\n\n来源: https://cdn.example.com/photo.png\n\nextracted text",
      tags: ["上传", "PDF"],
      userId: "user-1",
    } as never);
    mockAttachmentUpdate.mockResolvedValue({
      id: "att-1",
      fileName: "report.pdf",
      noteId: "note-1",
    } as never);
    mockStoreEmbedding.mockResolvedValue(undefined);

    const res = await POST(uploadRequest({ file, createNote: true }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.note).toMatchObject({ id: "note-1", title: "report" });
    expect(data.attachment).toMatchObject({ noteId: "note-1" });

    expect(mockNoteCreate).toHaveBeenCalledWith({
      data: {
        title: "report",
        content: expect.stringContaining("## 附件: report.pdf"),
        tags: ["上传", "PDF"],
        userId: "user-1",
      },
    });
    expect(mockAttachmentUpdate).toHaveBeenCalledWith({
      where: { id: "att-1" },
      data: { noteId: "note-1" },
    });
    expect(mockStoreEmbedding).toHaveBeenCalledWith(
      "note-1",
      expect.stringContaining("report")
    );
  });

  it("links attachment to existing note when noteId is set", async () => {
    const file = makeFile("scan.png", "image/png", 512);
    mockAttachmentCreate.mockResolvedValue({
      id: "att-2",
      fileName: "scan.png",
      mimeType: "image/png",
      noteId: "existing-note",
      userId: "user-1",
    } as never);

    const res = await POST(
      uploadRequest({ file, noteId: "existing-note" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.attachment).toMatchObject({ noteId: "existing-note" });
    expect(data.note).toBeNull();

    expect(mockAttachmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ noteId: "existing-note" }),
    });
    expect(mockNoteCreate).not.toHaveBeenCalled();
    expect(mockAttachmentUpdate).not.toHaveBeenCalled();
    expect(mockStoreEmbedding).not.toHaveBeenCalled();
  });

  it("does not auto-create note when noteId is set even if createNote=true", async () => {
    const file = makeFile("scan.png", "image/png", 512);
    mockAttachmentCreate.mockResolvedValue({
      id: "att-3",
      noteId: "existing-note",
    } as never);

    const res = await POST(
      uploadRequest({ file, noteId: "existing-note", createNote: true })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.note).toBeNull();
    expect(mockNoteCreate).not.toHaveBeenCalled();
    expect(mockStoreEmbedding).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected error", async () => {
    mockAttachmentCreate.mockRejectedValue(new Error("db down"));

    const res = await POST(
      uploadRequest({ file: makeFile("photo.png", "image/png", 100) })
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("上传失败");
  });
});