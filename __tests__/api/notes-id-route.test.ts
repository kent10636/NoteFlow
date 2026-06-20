import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
import { GET, PUT, DELETE } from "@/app/api/notes/[id]/route";

const mockAuth = vi.mocked(auth);
const mockFindFirst = vi.mocked(prisma.note.findFirst);
const mockUpdate = vi.mocked(prisma.note.update);
const mockDelete = vi.mocked(prisma.note.delete);
const mockSyncNoteLinks = vi.mocked(syncNoteLinks);
const mockStoreNoteEmbedding = vi.mocked(storeNoteEmbedding);

const params = Promise.resolve({ id: "n1" });

function updateRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/notes/n1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("notes [id] API route — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/notes/n1"), {
      params,
    });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns 404 when note does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/notes/n1"), {
      params,
    });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("笔记不存在");
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "n1", userId: "u1" },
    });
  });

  it("returns note when found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const note = {
      id: "n1",
      title: "测试笔记",
      content: "内容",
      tags: [],
      published: false,
      userId: "u1",
    };
    mockFindFirst.mockResolvedValue(note as never);

    const res = await GET(new Request("http://localhost/api/notes/n1"), {
      params,
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(note);
  });
});

describe("notes [id] API route — PUT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(updateRequest({ title: "新标题" }), { params });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns 404 when note does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue(null);

    const res = await PUT(updateRequest({ title: "新标题" }), { params });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("笔记不存在");
  });

  it("updates partial fields with trimmed title", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue({
      id: "n1",
      title: "旧标题",
      content: "旧内容",
    } as never);
    const updated = {
      id: "n1",
      title: "新标题",
      content: "新内容",
      summary: "摘要",
      tags: ["更新"],
      published: true,
      userId: "u1",
    };
    mockUpdate.mockResolvedValue(updated as never);

    const res = await PUT(
      updateRequest({
        title: "  新标题  ",
        content: "新内容",
        summary: "摘要",
        tags: ["更新"],
        published: true,
      }),
      { params }
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(updated);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: {
        title: "新标题",
        content: "新内容",
        summary: "摘要",
        tags: ["更新"],
        published: true,
      },
    });
    expect(mockSyncNoteLinks).toHaveBeenCalledWith(
      "u1",
      "n1",
      "新内容",
      prisma
    );
    expect(mockStoreNoteEmbedding).toHaveBeenCalledWith(
      "n1",
      "新标题\n新内容"
    );
  });

  it("updates only provided fields", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue({
      id: "n1",
      title: "原标题",
      content: "原内容",
    } as never);
    const updated = {
      id: "n1",
      title: "原标题",
      content: "仅更新内容",
      userId: "u1",
    };
    mockUpdate.mockResolvedValue(updated as never);

    const res = await PUT(updateRequest({ content: "仅更新内容" }), { params });

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { content: "仅更新内容" },
    });
    expect(mockSyncNoteLinks).toHaveBeenCalledWith(
      "u1",
      "n1",
      "仅更新内容",
      prisma
    );
    expect(mockStoreNoteEmbedding).toHaveBeenCalledWith(
      "n1",
      "原标题\n仅更新内容"
    );
  });

  it("returns 500 when update fails", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue({ id: "n1" } as never);
    mockUpdate.mockRejectedValue(new Error("db error"));

    const res = await PUT(updateRequest({ title: "失败" }), { params });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("更新笔记失败");
  });
});

describe("notes [id] API route — DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost/api/notes/n1"), {
      params,
    });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns 404 when note does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost/api/notes/n1"), {
      params,
    });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("笔记不存在");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("deletes note and returns success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue({ id: "n1", userId: "u1" } as never);
    mockDelete.mockResolvedValue({ id: "n1" } as never);

    const res = await DELETE(new Request("http://localhost/api/notes/n1"), {
      params,
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "n1", userId: "u1" },
    });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "n1" } });
  });
});