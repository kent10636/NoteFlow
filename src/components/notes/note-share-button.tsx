"use client";

import { useState } from "react";
import { Check, Copy, Globe, GlobeLock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildShareUrl } from "@/lib/share";

interface NoteShareButtonProps {
  noteId: string;
  initialPublished?: boolean;
  onPublishedChange?: (published: boolean) => void;
}

export function NoteShareButton({
  noteId,
  initialPublished = false,
  onPublishedChange,
}: NoteShareButtonProps) {
  const [published, setPublished] = useState(initialPublished);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? buildShareUrl(noteId, window.location.origin)
      : buildShareUrl(noteId);

  const togglePublished = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (!res.ok) throw new Error();
      const next = !published;
      setPublished(next);
      onPublishedChange?.(next);
      toast.success(next ? "笔记已公开" : "笔记已设为私密");
    } catch {
      toast.error("更新分享状态失败");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("分享链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制链接");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={published ? "default" : "outline"}
        size="sm"
        onClick={togglePublished}
        disabled={loading}
      >
        {published ? (
          <Globe className="mr-1 h-4 w-4" />
        ) : (
          <GlobeLock className="mr-1 h-4 w-4" />
        )}
        {loading ? "处理中..." : published ? "已公开" : "公开分享"}
      </Button>
      {published && (
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? (
            <Check className="mr-1 h-4 w-4" />
          ) : (
            <Copy className="mr-1 h-4 w-4" />
          )}
          复制链接
        </Button>
      )}
    </div>
  );
}