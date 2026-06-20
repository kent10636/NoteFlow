import { describe, it, expect } from "vitest";
import {
  isTagEdge,
  orderNodesOnCircle,
  pickEdgeHandles,
} from "@/lib/graph-layout";

describe("graph-layout", () => {
  it("routes edges horizontally when nodes are side by side", () => {
    const result = pickEdgeHandles({ x: 0, y: 100 }, { x: 200, y: 120 });
    expect(result).toEqual({
      sourceHandle: "right-s",
      targetHandle: "left-t",
    });
  });

  it("routes edges vertically only when strongly vertical", () => {
    const result = pickEdgeHandles({ x: 100, y: 300 }, { x: 110, y: 50 });
    expect(result).toEqual({
      sourceHandle: "top-s",
      targetHandle: "bottom-t",
    });
  });

  it("orders connected nodes adjacent on the circle", () => {
    const nodes = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
      { id: "d", label: "D" },
    ];

    const ordered = orderNodesOnCircle(nodes, [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ]);

    const ids = ordered.map((node) => node.id);
    const adjacent = (left: string, right: string) =>
      Math.abs(ids.indexOf(left) - ids.indexOf(right)) === 1;

    expect(adjacent("a", "b")).toBe(true);
    expect(adjacent("b", "c")).toBe(true);
  });

  it("identifies tag edges", () => {
    expect(isTagEdge("tag-a-b")).toBe(true);
    expect(isTagEdge("clxyz123")).toBe(false);
  });
});