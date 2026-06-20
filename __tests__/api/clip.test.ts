import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/clip-auth", () => ({
  resolveUserFromClipToken: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: { create: vi.fn() },
  },
}));
vi.mock("@/lib/embeddings", () => ({
  storeNoteEmbedding: vi.fn().mockResolvedValue(undefined),
}));

import { resolveUserFromClipToken } from "@/lib/clip-auth";
import { prisma } from "@/lib/prisma";
import { storeNoteEmbedding } from "@/lib/embeddings";
import { POST } from "@/app/api/clip/route";

const mockResolve = vi.mocked(resolveUserFromClipToken);
const mockCreate = vi.mocked(prisma.note.create);

describe("clip API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for invalid token", async () => {
    mockResolve.mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/clip", {
        method: "POST",
        headers: { Authorization: "Bearer bad" },
        body: JSON.stringify({ title: "Test" }),
      })
    );

    expect(res.status).toBe(401);
  });

  it("creates clipped note for valid token", async () => {
    mockResolve.mockResolvedValue("user-1");
    mockCreate.mockResolvedValue({
      id: "note-1",
      title: "示例",
      content: "# 示例",
    } as never);

    const res = await POST(
      new Request("http://localhost/api/clip", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: JSON.stringify({
          title: "示例",
          url: "https://example.com",
          selection: "选中内容",
        }),
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe("note-1");
    expect(data.url).toBe("/dashboard/notes/note-1");
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "示例",
        tags: ["剪藏"],
        userId: "user-1",
      }),
    });
    expect(storeNoteEmbedding).toHaveBeenCalled();
  });
});