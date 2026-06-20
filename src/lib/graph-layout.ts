export interface GraphLayoutEdge {
  source: string;
  target: string;
}

export interface GraphLayoutPosition {
  x: number;
  y: number;
}

export interface GraphLayoutNode {
  id: string;
}

/** Pick source/target handle ids based on relative node positions */
export function pickEdgeHandles(
  source: GraphLayoutPosition,
  target: GraphLayoutPosition
): { sourceHandle: string; targetHandle: string } {
  const dx = target.x - source.x;
  const dy = target.y - source.y;

  // Prefer horizontal routing when nodes are not strongly vertical — reduces hierarchy look
  if (Math.abs(dx) >= Math.abs(dy) * 0.55) {
    return dx > 0
      ? { sourceHandle: "right-s", targetHandle: "left-t" }
      : { sourceHandle: "left-s", targetHandle: "right-t" };
  }

  return dy > 0
    ? { sourceHandle: "bottom-s", targetHandle: "top-t" }
    : { sourceHandle: "top-s", targetHandle: "bottom-t" };
}

/** Place connected nodes adjacent on the circle to shorten edges */
export function orderNodesOnCircle<T extends GraphLayoutNode>(
  nodes: T[],
  edges: GraphLayoutEdge[]
): T[] {
  if (nodes.length <= 2) return nodes;

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, Set<string>>();

  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const leafNode = nodes.find((node) => (adjacency.get(node.id)?.size ?? 0) === 1);
  let startId = leafNode?.id ?? nodes[0].id;
  let maxDegree = -1;

  if (!leafNode) {
    for (const node of nodes) {
      const degree = adjacency.get(node.id)?.size ?? 0;
      if (degree > maxDegree) {
        maxDegree = degree;
        startId = node.id;
      }
    }
  }

  const orderedIds: string[] = [];
  const visited = new Set<string>();

  const walkChain = (currentId: string) => {
    orderedIds.push(currentId);
    visited.add(currentId);

    while (true) {
      const nextId = [...(adjacency.get(currentId) ?? [])]
        .sort()
        .find((neighborId) => !visited.has(neighborId));

      if (!nextId) break;

      orderedIds.push(nextId);
      visited.add(nextId);
      currentId = nextId;
    }
  };

  walkChain(startId);

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      walkChain(node.id);
    }
  }

  return orderedIds
    .map((id) => byId.get(id))
    .filter((node): node is T => node !== undefined);
}

export function isTagEdge(edgeId: string): boolean {
  return edgeId.startsWith("tag-");
}