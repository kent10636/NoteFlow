import { GitBranch } from "lucide-react";
import { KnowledgeGraph } from "@/components/graph/knowledge-graph";

export default function GraphPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <GitBranch className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">知识图谱</h1>
            <p className="mt-1 text-muted-foreground">
              可视化你的笔记关联网络，发现知识之间的联系
            </p>
          </div>
        </div>
      </div>
      <KnowledgeGraph />
    </div>
  );
}