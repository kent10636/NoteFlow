import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/tags/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.note.findMany);

describe("tags API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns aggregated tags", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([
      { tags: ["工作", "重要"] },
      { tags: ["工作"] },
    ] as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tags).toEqual([
      { name: "工作", count: 2 },
      { name: "重要", count: 1 },
    ]);
  });

  it("POST rename returns 400 without from/to", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([]);

    const res = await POST(
      new Request("http://localhost/api/tags", {
        method: "POST",
        body: JSON.stringify({ action: "rename", from: "", to: "新" }),
      })
    );

    expect(res.status).toBe(400);
  });

  it("POST rename updates matching notes", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany
      .mockResolvedValueOnce([
        { id: "n1", tags: ["旧标签", "其他"] },
        { id: "n2", tags: ["其他"] },
      ] as never)
      .mockResolvedValueOnce([{ tags: ["新标签", "其他"] }] as never);

    const res = await POST(
      new Request("http://localhost/api/tags", {
        method: "POST",
        body: JSON.stringify({
          action: "rename",
          from: "旧标签",
          to: "新标签",
        }),
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.updated).toBe(1);
    expect(prisma.note.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { tags: ["新标签", "其他"] },
    });
  });

  it("POST merge combines source tags", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany
      .mockResolvedValueOnce([
        { id: "n1", tags: ["todo", "工作"] },
      ] as never)
      .mockResolvedValueOnce([{ tags: ["任务", "工作"] }] as never);

    const res = await POST(
      new Request("http://localhost/api/tags", {
        method: "POST",
        body: JSON.stringify({
          action: "merge",
          sources: ["todo"],
          target: "任务",
        }),
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.updated).toBe(1);
  });

  it("POST returns 400 for unknown action", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([]);

    const res = await POST(
      new Request("http://localhost/api/tags", {
        method: "POST",
        body: JSON.stringify({ action: "delete" }),
      })
    );

    expect(res.status).toBe(400);
  });
});