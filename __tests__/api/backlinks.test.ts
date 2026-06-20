import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/notes/[id]/backlinks/route";

const mockAuth = vi.mocked(auth);
const mockFindFirst = vi.mocked(prisma.note.findFirst);
const mockFindMany = vi.mocked(prisma.note.findMany);

const routeParams = { params: Promise.resolve({ id: "target-note" }) };

describe("backlinks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 404 when note not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), routeParams);
    expect(res.status).toBe(404);
  });

  it("returns backlinks for existing note", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue({ id: "target-note" } as never);
    mockFindMany.mockResolvedValue([
      {
        id: "source-1",
        title: "来源笔记",
        updatedAt: new Date("2026-06-01T12:00:00.000Z"),
      },
    ] as never);

    const res = await GET(new Request("http://localhost"), routeParams);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.backlinks).toEqual([
      {
        id: "source-1",
        title: "来源笔记",
        updatedAt: "2026-06-01T12:00:00.000Z",
      },
    ]);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          linksFrom: { some: { toNoteId: "target-note" } },
        }),
      })
    );
  });

  it("returns empty array when no backlinks", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindFirst.mockResolvedValue({ id: "target-note" } as never);
    mockFindMany.mockResolvedValue([]);

    const res = await GET(new Request("http://localhost"), routeParams);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.backlinks).toEqual([]);
  });
});