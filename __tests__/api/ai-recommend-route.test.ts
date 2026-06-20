import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    noteLink: {
      upsert: vi.fn(),
    },
  },
}));
vi.mock("@/lib/ai", () => ({
  findRelatedNotes: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findRelatedNotes } from "@/lib/ai";
import { POST } from "@/app/api/ai/recommend/route";

const mockAuth = vi.mocked(auth);
const mockFindFirst = vi.mocked(prisma.note.findFirst);
const mockFindMany = vi.mocked(prisma.note.findMany);
const mockUpsert = vi.mocked(prisma.noteLink.upsert);
const mockFindRelated = vi.mocked(findRelatedNotes);

function recommendRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/ai/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("ai recommend API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(recommendRequest({ noteId: "n1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when note not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await POST(recommendRequest({ noteId: "missing" }));
    expect(res.status).toBe(404);
  });

  it("returns recommendations and upserts graph links", async () => {
    mockFindFirst.mockResolvedValue({
      id: "n1",
      content: "源笔记",
      userId: "u1",
    } as never);
    mockFindMany.mockResolvedValue([
      { id: "n2", title: "相关", content: "c2", summary: null, tags: [] },
      { id: "n3", title: "无关", content: "c3", summary: null, tags: [] },
    ] as never);
    mockFindRelated.mockResolvedValue([
      { id: "n2", reason: "主题相近" },
    ] as never);

    const res = await POST(recommendRequest({ noteId: "n1" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recommendations).toHaveLength(1);
    expect(data.recommendations[0]).toMatchObject({
      id: "n2",
      title: "相关",
      reason: "主题相近",
    });
    expect(mockUpsert).toHaveBeenCalledWith({
      where: {
        fromNoteId_toNoteId: { fromNoteId: "n1", toNoteId: "n2" },
      },
      create: {
        fromNoteId: "n1",
        toNoteId: "n2",
        strength: 0.8,
      },
      update: { strength: 0.8 },
    });
  });

  it("returns 500 on failure", async () => {
    mockFindFirst.mockRejectedValue(new Error("fail"));
    const res = await POST(recommendRequest({ noteId: "n1" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("推荐失败");
  });
});