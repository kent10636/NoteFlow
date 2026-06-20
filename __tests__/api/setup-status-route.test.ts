import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/env", () => ({ checkEnv: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: { count: vi.fn() },
    dailyReview: { count: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { checkEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/setup/status/route";

const mockAuth = vi.mocked(auth);
const mockCheckEnv = vi.mocked(checkEnv);
const mockNoteCount = vi.mocked(prisma.note.count);
const mockReviewCount = vi.mocked(prisma.dailyReview.count);

const defaultEnv = {
  valid: true,
  missing: [] as string[],
  warnings: [] as string[],
  optional: [
    { key: "XAI_API_KEY", configured: true, description: "Grok AI 完整功能" },
  ],
};

describe("setup status API route — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockCheckEnv.mockReturnValue(defaultEnv);
    mockNoteCount.mockResolvedValue(2);
    mockReviewCount.mockResolvedValue(1);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns onboarding status with steps, counts, and env", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toMatchObject({
      showOnboarding: false,
      isFirstTime: false,
      noteCount: 2,
      hasReview: 1,
      env: {
        valid: true,
        missing: [],
        warnings: [],
        optional: defaultEnv.optional,
      },
    });
    expect(data.steps).toHaveLength(5);
    expect(data.steps.map((step: { id: string }) => step.id)).toEqual([
      "register",
      "note",
      "ai",
      "search",
      "review",
    ]);
    expect(mockNoteCount).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(mockReviewCount).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("sets isFirstTime true when noteCount is 0", async () => {
    mockNoteCount.mockResolvedValue(0);
    mockReviewCount.mockResolvedValue(0);

    const res = await GET();
    const data = await res.json();

    expect(data.isFirstTime).toBe(true);
    expect(data.showOnboarding).toBe(true);
    expect(data.noteCount).toBe(0);
  });

  it("sets step done flags from noteCount and hasReview", async () => {
    mockNoteCount.mockResolvedValue(1);
    mockReviewCount.mockResolvedValue(0);

    const res = await GET();
    const data = await res.json();

    const byId = Object.fromEntries(
      data.steps.map((step: { id: string; done: boolean }) => [
        step.id,
        step.done,
      ])
    );

    expect(byId.register).toBe(true);
    expect(byId.note).toBe(true);
    expect(byId.ai).toBe(true);
    expect(byId.search).toBe(false);
    expect(byId.review).toBe(false);
  });

  it("shows onboarding when env is invalid or has warnings", async () => {
    mockNoteCount.mockResolvedValue(5);
    mockCheckEnv.mockReturnValue({
      ...defaultEnv,
      valid: false,
      missing: ["DATABASE_URL — PostgreSQL 数据库连接"],
    });

    const resInvalid = await GET();
    expect((await resInvalid.json()).showOnboarding).toBe(true);

    mockCheckEnv.mockReturnValue({
      ...defaultEnv,
      valid: true,
      warnings: ["未配置 XAI_API_KEY，AI 功能将使用本地回退"],
    });

    const resWarnings = await GET();
    expect((await resWarnings.json()).showOnboarding).toBe(true);
  });
});