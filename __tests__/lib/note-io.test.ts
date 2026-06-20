import { describe, it, expect } from "vitest";
import {
  MAX_IMPORT_NOTES,
  NOTE_IO_VERSION,
  parseNotesFromJson,
  parseNotesFromMarkdown,
  sanitizeImportPayloadSize,
  serializeNotesToJson,
  serializeNotesToMarkdown,
} from "@/lib/note-io";

const sampleNotes = [
  {
    title: "机器学习入门",
    content: "# 第一章\n\n基础概念",
    summary: "ML 基础",
    tags: ["AI", "学习"],
    published: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    title: "前端笔记",
    content: "React 与 Next.js",
    tags: ["前端"],
    published: true,
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-04T00:00:00.000Z",
  },
];

describe("note-io", () => {
  it("serializes and parses JSON export", () => {
    const payload = serializeNotesToJson(sampleNotes);
    expect(payload.version).toBe(NOTE_IO_VERSION);
    expect(payload.notes).toHaveLength(2);

    const parsed = parseNotesFromJson(payload);
    expect(parsed[0].title).toBe("机器学习入门");
    expect(parsed[0].tags).toEqual(["AI", "学习"]);
    expect(parsed[1].published).toBe(true);
  });

  it("rejects invalid JSON payloads", () => {
    expect(() => parseNotesFromJson({})).toThrow("notes 数组");
    expect(() => parseNotesFromJson({ notes: [{}] })).toThrow("缺少标题");
  });

  it("serializes and parses markdown export", () => {
    const markdown = serializeNotesToMarkdown(sampleNotes);
    expect(markdown).toContain("title: 机器学习入门");
    expect(markdown).toContain("tags: [\"AI\", \"学习\"]");

    const parsed = parseNotesFromMarkdown(markdown);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].title).toBe("机器学习入门");
    expect(parsed[0].content).toContain("基础概念");
    expect(parsed[1].tags).toEqual(["前端"]);
  });

  it("supports markdown blocks without frontmatter", () => {
    const parsed = parseNotesFromMarkdown("# 临时想法\n\n记录一下");
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("临时想法");
  });

  it("rejects import exceeding note count limit", () => {
    const notes = Array.from({ length: MAX_IMPORT_NOTES + 1 }, (_, i) => ({
      title: `笔记 ${i}`,
      content: "",
    }));
    expect(() => parseNotesFromJson({ notes })).toThrow(
      `单次最多导入 ${MAX_IMPORT_NOTES} 条笔记`
    );
  });

  it("rejects empty markdown import", () => {
    expect(() => parseNotesFromMarkdown("   ")).toThrow("Markdown 内容为空");
  });

  it("rejects malformed markdown frontmatter", () => {
    expect(() =>
      parseNotesFromMarkdown("---\ntitle: 无结束\n\n正文")
    ).toThrow("缺少 frontmatter 结束标记");
  });

  it("enforces max import file size", () => {
    expect(() => sanitizeImportPayloadSize(6 * 1024 * 1024)).toThrow(
      "导入文件不能超过 5MB"
    );
    expect(() => sanitizeImportPayloadSize(1024)).not.toThrow();
  });
});