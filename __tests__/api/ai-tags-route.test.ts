import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("@/lib/ai", () => ({
  generateTags: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTags } from "@/lib/ai";
import { POST } from "@/app/api/ai/tags/route";

const mockAuth = vi.mocked(auth);
const mockFindFirst = vi.mocked(prisma.note.findFirst);
const mockUpdate = vi.mocked(prisma.note.update);
const mockGenerateTags = vi.mocked(generateTags);

function tagsRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/ai/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("ai tags API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(tagsRequest({ noteId: "n1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when note not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await POST(tagsRequest({ noteId: "missing" }));
    expect(res.status).toBe(404);
  });

  it("merges generated tags with existing tags", async () => {
    mockFindFirst.mockResolvedValue({
      id: "n1",
      content: "机器学习笔记",
      tags: ["已有"],
      userId: "u1",
    } as never);
    mockGenerateTags.mockResolvedValue(["机器学习", "已有"]);
    mockUpdate.mockResolvedValue({
      tags: ["已有", "机器学习"],
    } as never);

    const res = await POST(tagsRequest({ noteId: "n1" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tags).toEqual(["已有", "机器学习"]);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { tags: ["已有", "机器学习"] },
    });
  });

  it("returns 500 on failure", async () => {
    mockFindFirst.mockRejectedValue(new Error("fail"));
    const res = await POST(tagsRequest({ noteId: "n1" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("生成标签失败");
  });
});