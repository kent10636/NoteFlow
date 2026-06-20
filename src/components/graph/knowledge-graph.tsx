"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { GitBranch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import GraphNoteNode from "@/components/graph/graph-note-node";
import {
  isTagEdge,
  orderNodesOnCircle,
  pickEdgeHandles,
} from "@/lib/graph-layout";
import type { GraphNode, GraphEdge } from "@/types";

const GRAPH_CENTER = { x: 400, y: 350 };

const nodeTypes = {
  graphNote: GraphNoteNode,
};

const TAG_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

function getTagColor(tags: string[]): string {
  if (tags.length === 0) return "#64748b";
  const hash = tags[0].split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
}

export function KnowledgeGraph() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  const layoutNodes = useCallback(
    (graphNodes: GraphNode[], graphEdges: GraphEdge[]) => {
      const orderedNodes = orderNodesOnCircle(graphNodes, graphEdges);
      const count = orderedNodes.length;
      const radius = Math.max(250, count * 35);

      const nodePositions = new Map(
        orderedNodes.map((node, i) => {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          return [
            node.id,
            {
              x: GRAPH_CENTER.x + radius * Math.cos(angle),
              y: GRAPH_CENTER.y + radius * Math.sin(angle),
            },
          ] as const;
        })
      );

      const flowNodes: Node[] = orderedNodes.map((node) => {
        const color = getTagColor(node.tags);
        const position = nodePositions.get(node.id)!;

        return {
          id: node.id,
          type: "graphNote",
          data: {
            borderColor: color,
            label: (
              <div className="text-center">
                <div className="max-w-[130px] truncate text-xs font-semibold">
                  {node.label}
                </div>
                {node.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                    {node.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded px-1 text-[9px]"
                        style={{ background: `${color}20`, color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          position,
        };
      });

      const flowEdges: Edge[] = graphEdges.map((edge) => {
        const tagEdge = isTagEdge(edge.id);
        const sourcePos = nodePositions.get(edge.source);
        const targetPos = nodePositions.get(edge.target);
        const handles =
          sourcePos && targetPos
            ? pickEdgeHandles(sourcePos, targetPos)
            : { sourceHandle: "right-s", targetHandle: "left-t" };

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          type: "smoothstep",
          pathOptions: { borderRadius: 24, offset: 20 },
          animated: !tagEdge && edge.strength > 0.6,
          label: !tagEdge && edge.strength > 0.8 ? "强关联" : undefined,
          labelStyle: { fontSize: 10, fill: "#64748b" },
          style: {
            strokeWidth: Math.max(1.5, edge.strength * 3),
            stroke: tagEdge ? "#94a3b8" : "var(--primary, #6366f1)",
            strokeDasharray: tagEdge ? "6,4" : undefined,
            opacity: tagEdge ? 0.75 : 0.9,
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
      setStats({ nodes: flowNodes.length, edges: flowEdges.length });
    },
    [setNodes, setEdges]
  );

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/graph");
      if (!res.ok) throw new Error();
      const data = await res.json();
      layoutNodes(data.nodes, data.edges);
    } catch (error) {
      console.error("Failed to load graph:", error);
    } finally {
      setLoading(false);
    }
  }, [layoutNodes]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/dashboard/notes/${node.id}`);
    },
    [router]
  );

  const legend = useMemo(
    () => (
      <div className="flex gap-2 text-xs">
        <Badge variant="outline">实线 = 笔记关联</Badge>
        <Badge variant="secondary">虚线 = 标签关联</Badge>
      </div>
    ),
    []
  );

  if (loading) {
    return <Skeleton className="h-[650px] w-full rounded-lg" />;
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-[650px] flex-col items-center justify-center rounded-lg border bg-muted/20">
        <GitBranch className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          暂无知识图谱数据。创建笔记并使用 AI 推荐功能来建立笔记关联。
        </p>
        <Button variant="outline" className="mt-4" onClick={fetchGraph}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[650px] rounded-lg border shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: "smoothstep" }}
        attributionPosition="bottom-left"
        minZoom={0.3}
        maxZoom={2}
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) =>
            (n.data as { borderColor?: string }).borderColor ?? "#64748b"
          }
          maskColor="rgba(0,0,0,0.08)"
        />
        <Panel position="top-right" className="flex flex-col gap-2">
          {legend}
          <div className="flex gap-2">
            <Badge>{stats.nodes} 节点</Badge>
            <Badge variant="secondary">{stats.edges} 关联</Badge>
            <Button size="sm" variant="outline" onClick={fetchGraph}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}