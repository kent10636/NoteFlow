import { describe, it, expect } from "vitest";
import { generateDailyReview } from "@/lib/daily-review";

describe("generateDailyReview", () => {
  it("should return empty state message when no notes", async () => {
    const result = await generateDailyReview([], "2026年6月20日");
    expect(result).toContain("每日回顾");
    expect(result).toContain("还没有");
  });

  it("should generate review with notes", async () => {
    const notes = [
      {
        title: "机器学习入门",
        content: "深度学习是机器学习的一个分支...",
        tags: ["AI", "学习"],
        summary: "介绍深度学习基础",
      },
      {
        title: "React 笔记",
        content: "React 是一个 UI 库...",
        tags: ["前端"],
        summary: null,
      },
    ];
    const result = await generateDailyReview(notes, "2026年6月20日");
    expect(result).toContain("每日回顾");
    expect(result.length).toBeGreaterThan(50);
  });
});