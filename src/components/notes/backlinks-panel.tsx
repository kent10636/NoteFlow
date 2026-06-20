"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import type { BacklinkItem } from "@/lib/backlinks";
import { formatDistanceToNow } from "@/lib/date";

interface BacklinksPanelProps {
  noteId?: string;
  refreshKey?: number;
}

export function BacklinksPanel({ noteId, refreshKey = 0 }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!noteId) {
      setBacklinks([]);
      return;
    }

    setLoading(true);
    fetch(`/api/notes/${noteId}/backlinks`)
      .then((res) => (res.ok ? res.json() : { backlinks: [] }))
      .then((data) => setBacklinks(data.backlinks ?? []))
      .catch(() => setBacklinks([]))
      .finally(() => setLoading(false));
  }, [noteId, refreshKey]);

  if (!noteId) return null;

  return (
    <div className="border-b bg-muted/20 px-6 py-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        反向链接
        <span className="text-muted-foreground">({backlinks.length})</span>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">加载中...</p>
      ) : backlinks.length === 0 ? (
        <p className="text-xs text-muted-foreground">暂无其他笔记链接到本篇</p>
      ) : (
        <ul className="space-y-1">
          {backlinks.map((note) => (
            <li key={note.id}>
              <Link
                href={`/dashboard/notes/${note.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted"
              >
                <span className="truncate">{note.title}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(note.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}