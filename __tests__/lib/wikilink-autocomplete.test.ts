import { describe, it, expect } from "vitest";
import {
  clampSelectedIndex,
  detectWikiLinkTrigger,
  filterNoteTitles,
  insertWikiLink,
} from "@/lib/wikilink-autocomplete";

describe("wikilink-autocomplete", () => {
  const titles = [
    { id: "1", title: "机器学习入门" },
    { id: "2", title: "前端笔记" },
    { id: "3", title: "React 学习" },
  ];

  it("detects active wiki link trigger before cursor", () => {
    const content = "参见 [[机器";
    const trigger = detectWikiLinkTrigger(content, content.length);
    expect(trigger).toEqual({
      query: "机器",
      replaceStart: 3,
      replaceEnd: 7,
    });
  });

  it("returns null when cursor is outside wiki link", () => {
    expect(detectWikiLinkTrigger("普通文本", 4)).toBeNull();
    expect(detectWikiLinkTrigger("已完成 [[笔记]]", 10)).toBeNull();
  });

  it("filters titles by query and excludes current note", () => {
    const result = filterNoteTitles(titles, "学习", "2");
    expect(result.map((item) => item.title)).toEqual([
      "机器学习入门",
      "React 学习",
    ]);
  });

  it("inserts selected wiki link and moves cursor to end", () => {
    const content = "参见 [[机器";
    const trigger = detectWikiLinkTrigger(content, content.length)!;
    const { nextContent, nextCursor } = insertWikiLink(
      content,
      trigger,
      "机器学习入门"
    );

    expect(nextContent).toBe("参见 [[机器学习入门]]");
    expect(nextCursor).toBe("参见 [[机器学习入门]]".length);
  });

  it("clamps selected index within options", () => {
    expect(clampSelectedIndex(3, 2)).toBe(1);
    expect(clampSelectedIndex(-1, 2)).toBe(0);
    expect(clampSelectedIndex(0, 0)).toBe(0);
  });

  it("returns null for out-of-bounds cursor", () => {
    expect(detectWikiLinkTrigger("[[a", -1)).toBeNull();
    expect(detectWikiLinkTrigger("[[a", 100)).toBeNull();
  });

  it("shows all titles when query is empty", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `id-${i}`,
      title: `笔记 ${i}`,
    }));
    const result = filterNoteTitles(many, "");
    expect(result).toHaveLength(8);
  });

  it("limits suggestions to 8 items", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `id-${i}`,
      title: `共同前缀 ${i}`,
    }));
    expect(filterNoteTitles(many, "共同")).toHaveLength(8);
  });
});