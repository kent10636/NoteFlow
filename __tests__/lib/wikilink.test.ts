import { describe, it, expect } from "vitest";
import {
  extractWikiLinks,
  resolveWikiLinkTargets,
} from "@/lib/wikilink";

describe("extractWikiLinks", () => {
  it("extracts single wiki link", () => {
    expect(extractWikiLinks("参见 [[机器学习入门]] 了解更多")).toEqual([
      "机器学习入门",
    ]);
  });

  it("extracts multiple wiki links", () => {
    expect(
      extractWikiLinks("关联 [[笔记 A]] 与 [[笔记 B]]，再看 [[笔记 C]]")
    ).toEqual(["笔记 A", "笔记 B", "笔记 C"]);
  });

  it("deduplicates links case-insensitively", () => {
    expect(extractWikiLinks("[[Note]] 和 [[note]] 是同一个")).toEqual(["Note"]);
  });

  it("trims whitespace inside brackets", () => {
    expect(extractWikiLinks("[[  前后空格  ]]")).toEqual(["前后空格"]);
  });

  it("ignores empty and malformed links", () => {
    expect(extractWikiLinks("[[ ]] 和 [[未闭合")).toEqual([]);
  });

  it("returns empty array when no links exist", () => {
    expect(extractWikiLinks("普通 Markdown 文本")).toEqual([]);
  });
});

describe("resolveWikiLinkTargets", () => {
  const notes = [
    { id: "n1", title: "机器学习入门" },
    { id: "n2", title: "前端笔记" },
    { id: "n3", title: "React 指南" },
  ];

  it("resolves titles to note ids case-insensitively", () => {
    expect(
      resolveWikiLinkTargets(["前端笔记", "react 指南"], notes, "source")
    ).toEqual(["n2", "n3"]);
  });

  it("skips unresolved titles", () => {
    expect(
      resolveWikiLinkTargets(["前端笔记", "不存在的笔记"], notes, "source")
    ).toEqual(["n2"]);
  });

  it("excludes self-links", () => {
    expect(
      resolveWikiLinkTargets(["机器学习入门"], notes, "n1")
    ).toEqual([]);
  });

  it("deduplicates multiple references to the same note", () => {
    expect(
      resolveWikiLinkTargets(["前端笔记", "前端笔记"], notes, "source")
    ).toEqual(["n2"]);
  });

  it("uses first note when titles collide case-insensitively", () => {
    const duplicateNotes = [
      { id: "first", title: "My Note" },
      { id: "second", title: "my note" },
    ];

    expect(
      resolveWikiLinkTargets(["MY NOTE"], duplicateNotes, "source")
    ).toEqual(["first"]);
  });
});