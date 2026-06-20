"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Merge, Pencil, Tag } from "lucide-react";
import { toast } from "sonner";
import type { TagStat } from "@/lib/tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameOpen, setRenameOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [activeTag, setActiveTag] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [mergeSources, setMergeSources] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTags(data.tags ?? []);
    } catch {
      toast.error("加载标签失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const runTagAction = async (body: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "操作失败");

      toast.success(`已更新 ${data.updated} 条笔记`);
      setTags(data.tags ?? []);
      setRenameOpen(false);
      setMergeOpen(false);
      setRenameTo("");
      setMergeSources("");
      setMergeTarget("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "标签操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const openRename = (name: string) => {
    setActiveTag(name);
    setRenameTo(name);
    setRenameOpen(true);
  };

  const openMerge = (name: string) => {
    setActiveTag(name);
    setMergeTarget(name);
    setMergeSources("");
    setMergeOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">标签管理</h1>
        <p className="mt-1 text-muted-foreground">
          查看、重命名和合并笔记标签
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            还没有标签，给笔记添加标签后会显示在这里
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <Card key={tag.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">
                    <Link
                      href={`/dashboard/notes?tag=${encodeURIComponent(tag.name)}`}
                      className="hover:text-primary"
                    >
                      {tag.name}
                    </Link>
                  </CardTitle>
                  <Badge variant="secondary">{tag.count} 条笔记</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRename(tag.name)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    重命名
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openMerge(tag.name)}
                  >
                    <Merge className="mr-1 h-4 w-4" />
                    合并
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名标签</DialogTitle>
            <DialogDescription>
              将「{activeTag}」重命名为新名称，所有相关笔记会同步更新
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameTo}
            onChange={(e) => setRenameTo(e.target.value)}
            placeholder="新标签名"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              取消
            </Button>
            <Button
              disabled={submitting || !renameTo.trim()}
              onClick={() =>
                runTagAction({
                  action: "rename",
                  from: activeTag,
                  to: renameTo.trim(),
                })
              }
            >
              {submitting ? "处理中..." : "确认重命名"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>合并标签</DialogTitle>
            <DialogDescription>
              将多个标签合并为「{mergeTarget || activeTag}」，源标签会被替换
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">
                要合并的标签（逗号分隔）
              </p>
              <Input
                value={mergeSources}
                onChange={(e) => setMergeSources(e.target.value)}
                placeholder="例如：todo, 待办"
              />
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">目标标签</p>
              <Input
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                placeholder="合并后的标签名"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>
              取消
            </Button>
            <Button
              disabled={submitting || !mergeTarget.trim()}
              onClick={() => {
                const sources = mergeSources
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (sources.length === 0) {
                  toast.error("请输入要合并的源标签");
                  return;
                }
                runTagAction({
                  action: "merge",
                  sources,
                  target: mergeTarget.trim(),
                });
              }}
            >
              {submitting ? "处理中..." : "确认合并"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}