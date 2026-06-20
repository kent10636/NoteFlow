import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: { findMany: vi.fn() },
    noteLink: { findMany: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/graph/route";

const mockAuth = vi.mocked(auth);
const mockNotes = vi.mocked(prisma.note.findMany);
const mockLinks = vi.mocked(prisma.noteLink.findMany);

describe("graph API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns nodes and explicit links", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockNotes.mockResolvedValue([
      { id: "n1", title: "笔记 A", tags: ["AI"] },
      { id: "n2", title: "笔记 B", tags: ["AI", "前端"] },
    ] as never);
    mockLinks.mockResolvedValue([
      {
        id: "link-1",
        fromNoteId: "n1",
        toNoteId: "n2",
        strength: 1,
      },
    ] as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.nodes).toEqual([
      { id: "n1", label: "笔记 A", tags: ["AI"] },
      { id: "n2", label: "笔记 B", tags: ["AI", "前端"] },
    ]);
    expect(data.edges).toContainEqual({
      id: "link-1",
      source: "n1",
      target: "n2",
      strength: 1,
    });
  });

  it("adds implicit tag-based edges when not already linked", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockNotes.mockResolvedValue([
      { id: "n1", title: "A", tags: ["共享"] },
      { id: "n2", title: "B", tags: ["共享"] },
    ] as never);
    mockLinks.mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(data.edges).toHaveLength(1);
    expect(data.edges[0]).toMatchObject({
      id: "tag-n1-n2",
      source: "n1",
      target: "n2",
      strength: 0.15,
    });
  });

  it("does not duplicate tag edge when explicit link exists", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockNotes.mockResolvedValue([
      { id: "n1", title: "A", tags: ["共享"] },
      { id: "n2", title: "B", tags: ["共享"] },
    ] as never);
    mockLinks.mockResolvedValue([
      { id: "existing", fromNoteId: "n1", toNoteId: "n2", strength: 1 },
    ] as never);

    const res = await GET();
    const data = await res.json();

    expect(data.edges).toHaveLength(1);
    expect(data.edges[0].id).toBe("existing");
  });
});