import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/notes/batch/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.note.findMany);

function batchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/notes/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("notes batch API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(batchRequest({ action: "delete", noteIds: ["n1"] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when noteIds empty", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const res = await POST(batchRequest({ action: "delete", noteIds: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when exceeding max batch size", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const res = await POST(
      batchRequest({
        action: "delete",
        noteIds: Array.from({ length: 101 }, (_, i) => `n${i}`),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when no owned notes found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([]);

    const res = await POST(batchRequest({ action: "delete", noteIds: ["n1"] }));
    expect(res.status).toBe(404);
  });

  it("deletes owned notes", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([
      { id: "n1", tags: [] },
      { id: "n2", tags: [] },
    ] as never);

    const res = await POST(
      batchRequest({ action: "delete", noteIds: ["n1", "n2"] })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.affected).toBe(2);
    expect(prisma.note.deleteMany).toHaveBeenCalled();
  });

  it("adds tags to owned notes", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([{ id: "n1", tags: ["已有"] }] as never);

    const res = await POST(
      batchRequest({
        action: "addTags",
        noteIds: ["n1"],
        tags: ["新增", "已有"],
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.affected).toBe(1);
    expect(prisma.note.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { tags: ["已有", "新增"] },
    });
  });

  it("removes tags from owned notes", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([
      { id: "n1", tags: ["移除", "保留"] },
    ] as never);

    const res = await POST(
      batchRequest({
        action: "removeTags",
        noteIds: ["n1"],
        tags: ["移除"],
      })
    );

    expect(res.status).toBe(200);
    expect(prisma.note.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { tags: ["保留"] },
    });
  });

  it("returns 400 for unsupported action", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockFindMany.mockResolvedValue([{ id: "n1", tags: [] }] as never);

    const res = await POST(
      batchRequest({ action: "archive", noteIds: ["n1"] })
    );
    expect(res.status).toBe(400);
  });
});