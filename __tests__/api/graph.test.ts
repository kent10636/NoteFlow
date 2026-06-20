import { describe, it, expect } from "vitest";

/** Test tag-based edge generation logic */
function generateTagEdges(
  notes: { id: string; tags: string[] }[],
  existingEdges: { source: string; target: string }[]
) {
  const edges: { id: string; source: string; target: string; strength: number }[] = [];
  const existingPairs = new Set(
    existingEdges.map((e) => `${e.source}-${e.target}`)
  );

  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const a = notes[i];
      const b = notes[j];
      const sharedTags = a.tags.filter((t) => b.tags.includes(t));
      if (sharedTags.length > 0) {
        const pairKey = `${a.id}-${b.id}`;
        const reverseKey = `${b.id}-${a.id}`;
        if (!existingPairs.has(pairKey) && !existingPairs.has(reverseKey)) {
          edges.push({
            id: `tag-${a.id}-${b.id}`,
            source: a.id,
            target: b.id,
            strength: Math.min(0.5, sharedTags.length * 0.15),
          });
          existingPairs.add(pairKey);
        }
      }
    }
  }
  return edges;
}

describe("Graph tag-based edges", () => {
  const notes = [
    { id: "n1", tags: ["AI", "学习"] },
    { id: "n2", tags: ["AI", "前端"] },
    { id: "n3", tags: ["烹饪"] },
  ];

  it("should create edges for shared tags", () => {
    const edges = generateTagEdges(notes, []);
    expect(edges.length).toBe(1);
    expect(edges[0].source).toBe("n1");
    expect(edges[0].target).toBe("n2");
    expect(edges[0].strength).toBeGreaterThan(0);
  });

  it("should not duplicate existing edges", () => {
    const edges = generateTagEdges(notes, [
      { source: "n1", target: "n2" },
    ]);
    expect(edges.length).toBe(0);
  });

  it("should not connect notes without shared tags", () => {
    const edges = generateTagEdges(
      [{ id: "a", tags: ["x"] }, { id: "b", tags: ["y"] }],
      []
    );
    expect(edges.length).toBe(0);
  });
});