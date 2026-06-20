import { describe, it, expect } from "vitest";
import { generateEmbedding } from "@/lib/ai";

describe("generateEmbedding", () => {
  it("should return a 1536-dimension vector", async () => {
    const embedding = await generateEmbedding("测试文本 for semantic search");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);
  });

  it("should produce normalized vectors", async () => {
    const embedding = await generateEmbedding("hello world");
    const magnitude = Math.sqrt(
      embedding.reduce((sum, v) => sum + v * v, 0)
    );
    expect(magnitude).toBeCloseTo(1, 1);
  });

  it("should produce different vectors for different texts", async () => {
    const a = await generateEmbedding("machine learning");
    const b = await generateEmbedding("cooking recipes");
    const same = a.every((v, i) => v === b[i]);
    expect(same).toBe(false);
  });
});