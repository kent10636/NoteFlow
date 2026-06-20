import { describe, it, expect } from "vitest";
import { buildClippedNote } from "@/lib/clip-note";

describe("buildClippedNote", () => {
  it("builds note from full payload", () => {
    const result = buildClippedNote({
      title: "示例文章",
      url: "https://example.com/post",
      selection: "选中段落",
      content: "页面摘要",
    });

    expect(result.title).toBe("示例文章");
    expect(result.tags).toEqual(["剪藏"]);
    expect(result.content).toContain("# 示例文章");
    expect(result.content).toContain("https://example.com/post");
    expect(result.content).toContain("选中段落");
    expect(result.content).toContain("页面摘要");
  });

  it("uses defaults when fields are missing", () => {
    const result = buildClippedNote({});

    expect(result.title).toBe("网页剪藏");
    expect(result.content).toContain("未捕获选中内容");
  });

  it("skips duplicate content section when same as selection", () => {
    const result = buildClippedNote({
      title: "T",
      selection: "same",
      content: "same",
    });

    expect(result.content).toContain("## 选中内容");
    expect(result.content).not.toContain("## 页面摘要");
  });
});