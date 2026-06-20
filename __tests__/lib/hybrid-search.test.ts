import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRawUnsafe: vi.fn() },
}));

vi.mock("@/lib/embeddings", () => ({
  semanticSearch: vi.fn(),
}));

import {
  formatTsQuery,
  mergeHybridResults,
  normalizeScoreValues,
  type ScoredSearchItem,
} from "@/lib/hybrid-search";

function makeItem(
  id: string,
  score: number,
  title = `Note ${id}`
): ScoredSearchItem {
  return {
    id,
    title,
    content: `Content for ${id}`,
    summary: null,
    tags: [],
    score,
  };
}

describe("normalizeScoreValues", () => {
  it("returns empty array for empty input", () => {
    expect(normalizeScoreValues([])).toEqual([]);
  });

  it("normalizes scores to 0-1 range", () => {
    expect(normalizeScoreValues([0, 5, 10])).toEqual([0, 0.5, 1]);
  });

  it("returns 1 for all scores when values are equal", () => {
    expect(normalizeScoreValues([3, 3, 3])).toEqual([1, 1, 1]);
  });
});

describe("formatTsQuery", () => {
  it("joins words with AND operator", () => {
    expect(formatTsQuery("machine learning notes")).toBe(
      "machine & learning & notes"
    );
  });

  it("strips tsquery special characters", () => {
    expect(formatTsQuery("foo & bar | baz")).toBe("foo & bar & baz");
  });

  it("returns empty string for whitespace-only query", () => {
    expect(formatTsQuery("   ")).toBe("");
  });
});

describe("mergeHybridResults", () => {
  it("merges results by note id with weighted score", () => {
    const semantic = [makeItem("a", 1), makeItem("b", 0.5)];
    const keyword = [makeItem("b", 10), makeItem("c", 5)];

    const merged = mergeHybridResults(semantic, keyword, 10);

    expect(merged.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(merged[0].similarity).toBeCloseTo(0.6, 5);
    expect(merged[1].similarity).toBeCloseTo(0.4, 5);
    expect(merged[2].similarity).toBeCloseTo(0, 5);
  });

  it("respects limit after ranking", () => {
    const semantic = [makeItem("a", 1), makeItem("b", 0.8), makeItem("c", 0.6)];
    const keyword = [makeItem("d", 1)];

    const merged = mergeHybridResults(semantic, keyword, 2);

    expect(merged).toHaveLength(2);
    expect(merged[0].id).toBe("a");
    expect(merged[1].id).toBe("d");
  });

  it("uses custom weights when provided", () => {
    const semantic = [makeItem("a", 10), makeItem("b", 0)];
    const keyword = [makeItem("a", 0), makeItem("b", 10)];

    const merged = mergeHybridResults(semantic, keyword, 10, 0.8, 0.2);

    expect(merged[0].similarity).toBeCloseTo(0.8, 5);
    expect(merged[1].similarity).toBeCloseTo(0.2, 5);
  });

  it("prefers higher combined score when ranking", () => {
    const semantic = [
      makeItem("strong-semantic", 10),
      makeItem("both", 10),
    ];
    const keyword = [
      makeItem("strong-keyword", 10),
      makeItem("both", 10),
    ];

    const merged = mergeHybridResults(semantic, keyword, 10);

    expect(merged[0].id).toBe("both");
    expect(merged[0].similarity).toBeCloseTo(1, 5);
    expect(merged[1].id).toBe("strong-semantic");
    expect(merged[1].similarity).toBeCloseTo(0.6, 5);
    expect(merged[2].id).toBe("strong-keyword");
    expect(merged[2].similarity).toBeCloseTo(0.4, 5);
  });
});