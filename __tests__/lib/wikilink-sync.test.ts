import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncNoteLinks } from "@/lib/wikilink";

function createMockPrisma() {
  return {
    note: { findMany: vi.fn() },
    noteLink: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      upsert: vi.fn().mockResolvedValue({}),
    },
  };
}

describe("syncNoteLinks", () => {
  const userId = "user-1";
  const noteId = "note-source";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes all outgoing links when content has no wikilinks", async () => {
    const prisma = createMockPrisma();
    prisma.note.findMany.mockResolvedValue([
      { id: "n1", title: "其他" },
    ]);

    await syncNoteLinks(userId, noteId, "普通文本", prisma as never);

    expect(prisma.noteLink.deleteMany).toHaveBeenCalledWith({
      where: { fromNoteId: noteId },
    });
    expect(prisma.noteLink.upsert).not.toHaveBeenCalled();
  });

  it("upserts links for resolved targets and prunes stale ones", async () => {
    const prisma = createMockPrisma();
    prisma.note.findMany.mockResolvedValue([
      { id: noteId, title: "源笔记" },
      { id: "n-target", title: "目标笔记" },
      { id: "n-other", title: "其他" },
    ]);

    await syncNoteLinks(
      userId,
      noteId,
      "参见 [[目标笔记]] 和 [[不存在的]]",
      prisma as never
    );

    expect(prisma.noteLink.deleteMany).toHaveBeenCalledWith({
      where: {
        fromNoteId: noteId,
        toNoteId: { notIn: ["n-target"] },
      },
    });
    expect(prisma.noteLink.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.noteLink.upsert).toHaveBeenCalledWith({
      where: {
        fromNoteId_toNoteId: { fromNoteId: noteId, toNoteId: "n-target" },
      },
      create: { fromNoteId: noteId, toNoteId: "n-target" },
      update: {},
    });
  });

  it("skips self-links and deduplicates targets", async () => {
    const prisma = createMockPrisma();
    prisma.note.findMany.mockResolvedValue([
      { id: noteId, title: "源" },
      { id: "n-peer", title: "同伴" },
    ]);

    await syncNoteLinks(
      userId,
      noteId,
      "[[源]] [[同伴]] [[同伴]]",
      prisma as never
    );

    expect(prisma.noteLink.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.noteLink.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fromNoteId_toNoteId: { fromNoteId: noteId, toNoteId: "n-peer" },
        },
      })
    );
  });

  it("queries only notes belonging to the user", async () => {
    const prisma = createMockPrisma();
    prisma.note.findMany.mockResolvedValue([]);

    await syncNoteLinks(userId, noteId, "[[任意]]", prisma as never);

    expect(prisma.note.findMany).toHaveBeenCalledWith({
      where: { userId },
      select: { id: true, title: true },
    });
  });
});