import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { chatCompletion, findRelatedNotes } from "@/lib/ai";

describe("chatCompletion fallback without API key", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.XAI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns local summary for summary prompts", async () => {
    const content = "这是一段关于机器学习的测试笔记内容。";
    const result = await chatCompletion(
      "You are a helpful assistant. Provide a summary of the following note.",
      content
    );
    expect(result).toMatch(/^【本地摘要】/);
    expect(result).toContain(content.slice(0, 50));
  });

  it("returns JSON tag array for tag prompts", async () => {
    const result = await chatCompletion(
      'Generate relevant tags. Return ONLY a JSON array of strings.',
      "machine learning deep neural networks artificial intelligence research"
    );
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it("returns daily review fallback for daily review prompts", async () => {
    const result = await chatCompletion(
      "Generate a thoughtful daily review in Markdown format.",
      "Date: 2026年6月21日\nTotal notes: 3\n\n### 笔记 1: Test"
    );
    expect(result).toContain("今日共记录 **3** 条笔记");
    expect(result).toContain("继续保持学习节奏");
  });
});

describe("findRelatedNotes", () => {
  const originalEnv = { ...process.env };
  const existingNotes = [
    {
      id: "n1",
      title: "Machine Learning Basics",
      content: "Deep learning is an important branch of machine learning using neural networks.",
    },
    {
      id: "n2",
      title: "React Intro",
      content: "React is a JavaScript library for building user interfaces.",
    },
    {
      id: "n3",
      title: "Neural Networks",
      content: "Neural networks are composed of layers and commonly used in deep learning tasks.",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("returns empty array when existing notes is empty", async () => {
    const result = await findRelatedNotes("some content", []);
    expect(result).toEqual([]);
  });

  it("uses keywordRelated fallback without API key", async () => {
    delete process.env.XAI_API_KEY;

    const result = await findRelatedNotes(
      "Deep learning and neural networks are core machine learning topics.",
      existingNotes
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("reason");
    expect(result[0].reason).toMatch(/关键词匹配/);
    expect(result.map((r) => r.id)).toContain("n1");
    expect(result.map((r) => r.id)).toContain("n3");
  });

  it("uses API response when fetch returns valid JSON array", async () => {
    process.env.XAI_API_KEY = "test-key";

    const apiResults = [
      { id: "n1", reason: "主题高度相关" },
      { id: "n3", reason: "同样讨论神经网络" },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(apiResults) } }],
        }),
      })
    );

    const result = await findRelatedNotes(
      "深度学习和神经网络",
      existingNotes
    );

    expect(result).toEqual(apiResults);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.x.ai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      })
    );
  });
});