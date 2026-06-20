import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/notes/titles/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.note.findMany);

describe("notes titles API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns note titles for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([
      { id: "n1", title: "第一篇" },
      { id: "n2", title: "第二篇" },
    ] as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([
      { id: "n1", title: "第一篇" },
      { id: "n2", title: "第二篇" },
    ]);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    });
  });
});