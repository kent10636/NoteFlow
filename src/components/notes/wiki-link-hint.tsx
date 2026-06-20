import { Link2 } from "lucide-react";

export function WikiLinkHint() {
  return (
    <p className="flex items-center gap-1.5 border-b bg-muted/20 px-6 py-2 text-xs text-muted-foreground">
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      使用{" "}
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
        [[笔记名]]
      </code>{" "}
      创建双向链接，保存后会在知识图谱中显示关联
    </p>
  );
}