import { describe, it, expect } from "vitest";
import { generateSummary, generateTags } from "@/lib/ai";

describe("AI utilities", () => {
  it("should generate a fallback summary without API key", async () => {
    const summary = await generateSummary("这是一段关于机器学习的测试笔记内容。");
    expect(summary).toBeTruthy();
    expect(typeof summary).toBe("string");
  });

  it("should generate fallback tags without API key", async () => {
    const tags = await generateTags("机器学习 深度学习 神经网络 人工智能");
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });
});