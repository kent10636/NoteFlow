"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckSquare, PenLine, Square, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { NoteCard } from "@/components/notes/note-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  updatedAt: string;
}

interface NotesListProps {
  notes: NoteItem[];
}

export function NotesList({ notes }: NotesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagAction, setTagAction] = useState<"addTags" | "removeTags">("addTags");
  const [tagInput, setTagInput] = useState("");

  const filteredNotes = useMemo(() => {
    if (!activeTag) return notes;
    return notes.filter((note) => note.tags.includes(activeTag));
  }, [notes, activeTag]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotes.map((n) => n.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const runBatch = async (
    action: "delete" | "addTags" | "removeTags",
    tags?: string[]
  ) => {
    if (selectedIds.size === 0) {
      toast.error("请先选择笔记");
      return;
    }

    if (action === "delete" && !confirm(`确定删除 ${selectedIds.size} 条笔记？`)) {
      return;
    }

    setBatchLoading(true);
    try {
      const res = await fetch("/api/notes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          noteIds: [...selectedIds],
          tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "操作失败");

      toast.success(`已处理 ${data.affected} 条笔记`);
      clearSelection();
      setTagDialogOpen(false);
      setTagInput("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "批量操作失败");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleTagSubmit = () => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) {
      toast.error("请输入至少一个标签");
      return;
    }
    runBatch(tagAction, tags);
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="mb-4 text-lg text-muted-foreground">
          还没有笔记，创建你的第一条吧！
        </p>
        <Link href="/dashboard/notes/new">
          <Button size="lg">
            <PenLine className="mr-2 h-4 w-4" />
            新建笔记
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">筛选标签：</span>
          <Badge variant="secondary" className="gap-1">
            {activeTag}
            <button
              type="button"
              onClick={() => router.push("/dashboard/notes")}
              className="ml-1 rounded-sm hover:bg-muted"
              aria-label="清除筛选"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
          <span className="text-sm text-muted-foreground">
            {filteredNotes.length} 条结果
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {!selectionMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectionMode(true)}
          >
            <CheckSquare className="mr-1 h-4 w-4" />
            批量选择
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={selectAll}>
              全选
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              取消
            </Button>
            <span className="text-sm text-muted-foreground">
              已选 {selectedIds.size} 条
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.size === 0 || batchLoading}
              onClick={() => {
                setTagAction("addTags");
                setTagDialogOpen(true);
              }}
            >
              <Tag className="mr-1 h-4 w-4" />
              添加标签
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.size === 0 || batchLoading}
              onClick={() => {
                setTagAction("removeTags");
                setTagDialogOpen(true);
              }}
            >
              <Tag className="mr-1 h-4 w-4" />
              移除标签
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedIds.size === 0 || batchLoading}
              onClick={() => runBatch("delete")}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              删除
            </Button>
          </>
        )}
      </div>

      {filteredNotes.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          没有匹配该标签的笔记
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div key={note.id} className="relative">
              {selectionMode && (
                <button
                  type="button"
                  onClick={() => toggleSelect(note.id)}
                  className="absolute left-3 top-3 z-10 rounded-md bg-background/80 p-1 shadow-sm backdrop-blur"
                  aria-label={selectedIds.has(note.id) ? "取消选择" : "选择笔记"}
                >
                  {selectedIds.has(note.id) ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              )}
              <div
                className={
                  selectionMode
                    ? selectedIds.has(note.id)
                      ? "cursor-pointer rounded-xl ring-2 ring-primary"
                      : "cursor-pointer opacity-90"
                    : undefined
                }
                onClick={
                  selectionMode ? () => toggleSelect(note.id) : undefined
                }
                onKeyDown={
                  selectionMode
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSelect(note.id);
                        }
                      }
                    : undefined
                }
                role={selectionMode ? "button" : undefined}
                tabIndex={selectionMode ? 0 : undefined}
              >
                <NoteCard {...note} linkable={!selectionMode} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tagAction === "addTags" ? "批量添加标签" : "批量移除标签"}
            </DialogTitle>
            <DialogDescription>
              多个标签用逗号分隔，将应用于 {selectedIds.size} 条笔记
            </DialogDescription>
          </DialogHeader>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="例如：工作, 重要"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleTagSubmit} disabled={batchLoading}>
              {batchLoading ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}