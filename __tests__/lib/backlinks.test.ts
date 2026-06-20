import { describe, it, expect } from "vitest";
import { formatBacklinks } from "@/lib/backlinks";

describe("formatBacklinks", () => {
  it("formats backlink items with ISO dates", () => {
    const date = new Date("2026-06-01T12:00:00.000Z");
    const result = formatBacklinks([
      { id: "n1", title: "来源笔记", updatedAt: date },
    ]);

    expect(result).toEqual([
      {
        id: "n1",
        title: "来源笔记",
        updatedAt: "2026-06-01T12:00:00.000Z",
      },
    ]);
  });
});