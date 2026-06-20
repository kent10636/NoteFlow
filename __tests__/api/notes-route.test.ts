import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
vi.mock("@/lib/embeddings", () => ({
  storeNoteEmbedding: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/wikilink", () => ({
  syncNoteLinks: vi.fn().mockResolvedValue(undefined),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeNoteEmbedding } from "@/lib/embeddings";
import { syncNoteLinks } from "@/lib/wikilink";
import { GET, POST } from "@/app/api/notes/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.note.findMany);
const mockCreate = vi.mocked(prisma.note.create);
const mockSyncNoteLinks = vi.mocked(syncNoteLinks);
const mockStoreNoteEmbedding = vi.mocked(storeNoteEmbedding);

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("notes API route — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns notes list ordered by updatedAt desc", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const notes = [
      {
        id: "n1",
        title: "最新",
        content: "内容1",
        summary: null,
        tags: ["tag1"],
        published: false,
        createdAt: "2024-01-02",
        updatedAt: "2024-01-02",
      },
      {
        id: "n2",
        title: "较早",
        content: "内容2",
        summary: "摘要",
        tags: [],
        published: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];
    mockFindMany.mockResolvedValue(notes as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(notes);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        tags: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
});

describe("notes API route — POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(createRequest({ title: "标题" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns 400 when title is empty", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const res = await POST(createRequest({ title: "" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("标题不能为空");
  });

  it("returns 400 when title is whitespace only", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const res = await POST(createRequest({ title: "   " }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("标题不能为空");
  });

  it("creates note with trimmed title and defaults", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const created = {
      id: "n1",
      title: "新笔记",
      content: "",
      tags: [],
      published: false,
      userId: "u1",
    };
    mockCreate.mockResolvedValue(created as never);

    const res = await POST(createRequest({ title: "  新笔记  " }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual(created);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "新笔记",
        content: "",
        tags: [],
        published: false,
        userId: "u1",
      },
    });
    expect(mockSyncNoteLinks).toHaveBeenCalledWith("u1", "n1", "", prisma);
    expect(mockStoreNoteEmbedding).toHaveBeenCalledWith("n1", "新笔记\n");
  });

  it("creates note with provided content, tags, and published", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const created = {
      id: "n2",
      title: "完整笔记",
      content: "正文内容",
      tags: ["学习", "AI"],
      published: true,
      userId: "u1",
    };
    mockCreate.mockResolvedValue(created as never);

    const res = await POST(
      createRequest({
        title: "完整笔记",
        content: "正文内容",
        tags: ["学习", "AI"],
        published: true,
      })
    );

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "完整笔记",
        content: "正文内容",
        tags: ["学习", "AI"],
        published: true,
        userId: "u1",
      },
    });
    expect(mockSyncNoteLinks).toHaveBeenCalledWith(
      "u1",
      "n2",
      "正文内容",
      prisma
    );
    expect(mockStoreNoteEmbedding).toHaveBeenCalledWith(
      "n2",
      "完整笔记\n正文内容"
    );
  });

  it("returns 500 when create fails", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockCreate.mockRejectedValue(new Error("db error"));

    const res = await POST(createRequest({ title: "失败笔记" }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("创建笔记失败");
  });
});