import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: { findMany: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/notes/export/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.note.findMany);

const EXPORT_URL = "http://localhost/api/notes/export";

const sampleDbNotes = [
  {
    title: "导出笔记",
    content: "正文内容",
    summary: "摘要",
    tags: ["标签"],
    published: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
];

describe("notes export API route — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindMany.mockResolvedValue(sampleDbNotes as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(new Request(EXPORT_URL));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("未授权");
  });

  it("returns JSON export with Content-Disposition header", async () => {
    const res = await GET(new Request(`${EXPORT_URL}?format=json`));
    const text = await res.text();
    const payload = JSON.parse(text);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(res.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="noteflow-export-\d{4}-\d{2}-\d{2}\.json"$/
    );
    expect(payload.notes).toHaveLength(1);
    expect(payload.notes[0]).toMatchObject({
      title: "导出笔记",
      content: "正文内容",
      summary: "摘要",
      tags: ["标签"],
      published: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { updatedAt: "desc" },
      select: {
        title: true,
        content: true,
        summary: true,
        tags: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("returns markdown export with text/markdown content-type", async () => {
    const res = await GET(new Request(`${EXPORT_URL}?format=markdown`));
    const markdown = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8"
    );
    expect(res.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="noteflow-export-\d{4}-\d{2}-\d{2}\.md"$/
    );
    expect(markdown).toContain("title: 导出笔记");
    expect(markdown).toContain("正文内容");
  });

  it("defaults to JSON format when format param is omitted", async () => {
    const res = await GET(new Request(EXPORT_URL));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(res.headers.get("Content-Disposition")).toMatch(/\.json"$/);

    const payload = JSON.parse(await res.text());
    expect(payload.notes).toHaveLength(1);
  });
});