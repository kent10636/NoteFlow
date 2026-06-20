import { describe, it, expect } from "vitest";
import { formatDistanceToNow } from "@/lib/date";

describe("formatDistanceToNow", () => {
  it("should return '刚刚' for recent dates", () => {
    const now = new Date();
    expect(formatDistanceToNow(now)).toBe("刚刚");
  });

  it("should return minutes ago for dates within an hour", () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    expect(formatDistanceToNow(thirtyMinAgo)).toBe("30 分钟前");
  });

  it("should format old dates", () => {
    const oldDate = new Date("2020-01-15");
    const result = formatDistanceToNow(oldDate);
    expect(result).toContain("2020");
  });
});