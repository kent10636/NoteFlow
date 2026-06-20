"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Skeleton } from "@/components/ui/skeleton";
import type { GraphNode, GraphEdge } from "@/types";

export function KnowledgeGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const layoutNodes = useCallback(
    (graphNodes: GraphNode[], graphEdges: GraphEdge[]) => {
      const count = graphNodes.length;
      const radius = Math.max(200, count * 30);

      const flowNodes: Node[] = graphNodes.map((node, i) => {
        const angle = (2 * Math.PI * i) / count;
        return {
          id: node.id,
          data: {
            label: (
              <div className="text-center">
                <div className="max-w-[120px] truncate text-xs font-medium">
                  {node.label}
                </div>
                {node.tags.length > 0 && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {node.tags.slice(0, 2).join(", ")}
                  </div>
                )}
              </div>
            ),
          },
          position: {
            x: 400 + radius * Math.cos(angle),
            y: 300 + radius * Math.sin(angle),
          },
          style: {
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            width: 140,
          },
        };
      });

      const flowEdges: Edge[] = graphEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.strength > 0.7,
        style: {
          strokeWidth: Math.max(1, edge.strength * 3),
          stroke: "hsl(var(--primary))",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: "hsl(var(--primary))",
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    async function fetchGraph() {
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
    }
    fetchGraph();
  }, [layoutNodes]);

  if (loading) {
    return <Skeleton className="h-[600px] w-full rounded-lg" />;
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border bg-muted/20">
        <p className="text-muted-foreground">
          暂无知识图谱数据。创建笔记并使用 AI 推荐功能来建立笔记关联。
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}