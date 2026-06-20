import { Position } from "reactflow";

export interface GraphLayoutEdge {
  source: string;
  target: string;
}

export interface GraphLayoutPosition {
  x: number;
  y: number;
}

export function positionFromDelta(
  dx: number,
  dy: number
): { sourcePosition: Position; targetPosition: Position } {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { sourcePosition: Position.Right, targetPosition: Position.Left }
      : { sourcePosition: Position.Left, targetPosition: Position.Right };
  }

  return dy > 0
    ? { sourcePosition: Position.Bottom, targetPosition: Position.Top }
    : { sourcePosition: Position.Top, targetPosition: Position.Bottom };
}

export function computeNodeHandlePositions(
  nodeId: string,
  positions: Map<string, GraphLayoutPosition>,
  edges: GraphLayoutEdge[],
  fallbackCenter = { x: 400, y: 350 }
): { sourcePosition: Position; targetPosition: Position } {
  const self = positions.get(nodeId);
  if (!self) {
    return {
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  }

  const neighbors: GraphLayoutPosition[] = [];

  for (const edge of edges) {
    if (edge.source === nodeId) {
      const target = positions.get(edge.target);
      if (target) neighbors.push(target);
    }
    if (edge.target === nodeId) {
      const source = positions.get(edge.source);
      if (source) neighbors.push(source);
    }
  }

  if (neighbors.length === 0) {
    return positionFromDelta(
      self.x - fallbackCenter.x,
      self.y - fallbackCenter.y
    );
  }

  const avgX =
    neighbors.reduce((sum, point) => sum + point.x, 0) / neighbors.length;
  const avgY =
    neighbors.reduce((sum, point) => sum + point.y, 0) / neighbors.length;

  return positionFromDelta(avgX - self.x, avgY - self.y);
}

export function isTagEdge(edgeId: string): boolean {
  return edgeId.startsWith("tag-");
}