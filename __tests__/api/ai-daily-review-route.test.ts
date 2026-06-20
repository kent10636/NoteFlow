import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReview: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    note: {
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/daily-review", () => ({
  generateDailyReview: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDailyReview } from "@/lib/daily-review";
import { GET, POST } from "@/app/api/ai/daily-review/route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.dailyReview.findUnique);
const mockUpsert = vi.mocked(prisma.dailyReview.upsert);
const mockFindNotes = vi.mocked(prisma.note.findMany);
const mockGenerate = vi.mocked(generateDailyReview);

describe("ai daily-review API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns existing review when found", async () => {
    const review = {
      id: "r1",
      content: "今日回顾",
      noteCount: 3,
      date: new Date(),
    };
    mockFindUnique.mockResolvedValue(review as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toMatchObject({
      id: "r1",
      content: "今日回顾",
      noteCount: 3,
    });
    expect(new Date(data.date).toISOString()).toBe(review.date.toISOString());
  });

  it("GET returns empty placeholder when no review yet", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ content: null, noteCount: 0 });
  });

  it("POST returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("POST generates and upserts daily review", async () => {
    const notes = [{ title: "笔记 A", content: "内容", tags: [], summary: null }];
    mockFindNotes.mockResolvedValue(notes as never);
    mockGenerate.mockResolvedValue("生成的回顾");
    mockUpsert.mockResolvedValue({
      id: "r1",
      content: "生成的回顾",
      noteCount: 1,
    } as never);

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.content).toBe("生成的回顾");
    expect(mockGenerate).toHaveBeenCalledWith(
      notes,
      expect.stringMatching(/\d{4}年/)
    );
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          content: "生成的回顾",
          noteCount: 1,
          userId: "u1",
        }),
        update: {
          content: "生成的回顾",
          noteCount: 1,
        },
      })
    );
  });

  it("POST returns 500 on failure", async () => {
    mockFindNotes.mockRejectedValue(new Error("fail"));
    const res = await POST();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("生成每日回顾失败");
  });
});