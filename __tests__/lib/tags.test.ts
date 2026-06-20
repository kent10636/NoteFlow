import { describe, it, expect } from "vitest";
import {
  aggregateTags,
  mergeTagsInNotes,
  renameTagInNotes,
} from "@/lib/tags";

describe("aggregateTags", () => {
  it("counts tags across notes", () => {
    const result = aggregateTags([
      { tags: ["工作", "重要"] },
      { tags: ["工作", "读书"] },
      { tags: ["工作"] },
    ]);

    expect(result).toEqual([
      { name: "工作", count: 3 },
      { name: "读书", count: 1 },
      { name: "重要", count: 1 },
    ]);
  });

  it("ignores empty tags", () => {
    expect(aggregateTags([{ tags: ["", "  ", "有效"] }])).toEqual([
      { name: "有效", count: 1 },
    ]);
  });
});

describe("renameTagInNotes", () => {
  const notes = [
    { id: "1", tags: ["工作", "重要"] },
    { id: "2", tags: ["读书"] },
    { id: "3", tags: ["工作"] },
  ];

  it("renames matching tags", () => {
    expect(renameTagInNotes(notes, "工作", "职场")).toEqual([
      { id: "1", tags: ["职场", "重要"] },
      { id: "3", tags: ["职场"] },
    ]);
  });

  it("returns empty when tags are blank", () => {
    expect(renameTagInNotes(notes, "", "x")).toEqual([]);
    expect(renameTagInNotes(notes, "工作", "")).toEqual([]);
  });
});

describe("mergeTagsInNotes", () => {
  const notes = [
    { id: "1", tags: ["todo", "工作"] },
    { id: "2", tags: ["待办", "读书"] },
    { id: "3", tags: ["其他"] },
  ];

  it("merges multiple source tags into target", () => {
    expect(mergeTagsInNotes(notes, ["todo", "待办"], "任务")).toEqual([
      { id: "1", tags: ["任务", "工作"] },
      { id: "2", tags: ["任务", "读书"] },
    ]);
  });

  it("deduplicates when note already has target tag", () => {
    expect(
      mergeTagsInNotes([{ id: "1", tags: ["todo", "任务"] }], ["todo"], "任务")
    ).toEqual([{ id: "1", tags: ["任务"] }]);
  });
});