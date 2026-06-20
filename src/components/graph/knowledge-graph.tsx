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
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { GitBranch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { GraphNode, GraphEdge } from "@/types";

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
      const count = graphNodes.length;
      const radius = Math.max(250, count * 35);

      const flowNodes: Node[] = graphNodes.map((node, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        const color = getTagColor(node.tags);
        return {
          id: node.id,
          data: {
            tags: node.tags,
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
          position: {
            x: 400 + radius * Math.cos(angle),
            y: 350 + radius * Math.sin(angle),
          },
          style: {
            background: "var(--card, #fff)",
            border: `2px solid ${color}`,
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "12px",
            width: 150,
            boxShadow: `0 2px 8px ${color}30`,
            cursor: "pointer",
          },
        };
      });

      const flowEdges: Edge[] = graphEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.strength > 0.6,
        label: edge.strength > 0.8 ? "强关联" : undefined,
        labelStyle: { fontSize: 10, fill: "#64748b" },
        style: {
          strokeWidth: Math.max(1.5, edge.strength * 4),
          stroke: edge.id.startsWith("tag-") ? "#94a3b8" : "var(--primary, #6366f1)",
          strokeDasharray: edge.id.startsWith("tag-") ? "5,5" : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: edge.id.startsWith("tag-") ? "#94a3b8" : "var(--primary, #6366f1)",
        },
      }));

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
        <Badge variant="outline">实线 = AI 推荐关联</Badge>
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
        attributionPosition="bottom-left"
        minZoom={0.3}
        maxZoom={2}
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => getTagColor((n.data as { tags?: string[] }).tags ?? [])}
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