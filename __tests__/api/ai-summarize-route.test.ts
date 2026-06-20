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
  generateSummary: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/ai";
import { POST } from "@/app/api/ai/summarize/route";

const mockAuth = vi.mocked(auth);
const mockFindFirst = vi.mocked(prisma.note.findFirst);
const mockUpdate = vi.mocked(prisma.note.update);
const mockGenerateSummary = vi.mocked(generateSummary);

function summarizeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("ai summarize API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(summarizeRequest({ noteId: "n1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when note not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await POST(summarizeRequest({ noteId: "missing" }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("笔记不存在");
  });

  it("generates and saves summary", async () => {
    mockFindFirst.mockResolvedValue({
      id: "n1",
      content: "长文内容",
      userId: "u1",
    } as never);
    mockGenerateSummary.mockResolvedValue("摘要结果");
    mockUpdate.mockResolvedValue({ summary: "摘要结果" } as never);

    const res = await POST(summarizeRequest({ noteId: "n1" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.summary).toBe("摘要结果");
    expect(mockGenerateSummary).toHaveBeenCalledWith("长文内容");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { summary: "摘要结果" },
    });
  });

  it("returns 500 on unexpected error", async () => {
    mockFindFirst.mockRejectedValue(new Error("db down"));
    const res = await POST(summarizeRequest({ noteId: "n1" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("生成摘要失败");
  });
});