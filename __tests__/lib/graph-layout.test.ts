import { describe, it, expect } from "vitest";
import { Position } from "reactflow";
import {
  computeNodeHandlePositions,
  isTagEdge,
  positionFromDelta,
} from "@/lib/graph-layout";

describe("graph-layout", () => {
  it("picks horizontal handles when neighbor is to the right", () => {
    const result = positionFromDelta(100, 10);
    expect(result.sourcePosition).toBe(Position.Right);
    expect(result.targetPosition).toBe(Position.Left);
  });

  it("picks vertical handles when neighbor is above", () => {
    const result = positionFromDelta(10, -80);
    expect(result.sourcePosition).toBe(Position.Top);
    expect(result.targetPosition).toBe(Position.Bottom);
  });

  it("uses neighbor centroid for connected nodes", () => {
    const positions = new Map([
      ["a", { x: 0, y: 0 }],
      ["b", { x: 200, y: 0 }],
      ["c", { x: 100, y: 0 }],
    ]);

    const result = computeNodeHandlePositions("a", positions, [
      { source: "a", target: "b" },
      { source: "c", target: "a" },
    ]);

    expect(result.sourcePosition).toBe(Position.Right);
    expect(result.targetPosition).toBe(Position.Left);
  });

  it("identifies tag edges", () => {
    expect(isTagEdge("tag-a-b")).toBe(true);
    expect(isTagEdge("clxyz123")).toBe(false);
  });
});