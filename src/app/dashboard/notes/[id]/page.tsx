"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { NoteEditor } from "@/components/notes/note-editor";
import { Skeleton } from "@/components/ui/skeleton";

interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  summary: string | null;
}

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await fetch(`/api/notes/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setNote(data);
      } catch {
        toast.error("加载笔记失败");
        router.push("/dashboard/notes");
      } finally {
        setLoading(false);
      }
    }
    fetchNote();
  }, [id, router]);

  const handleSave = useCallback(
    async (data: { title: string; content: string; tags: string[] }) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setNote(updated);
    },
    [id]
  );

  const handleDelete = useCallback(async () => {
    if (!confirm("确定要删除这条笔记吗？")) return;

    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("删除失败");
      return;
    }
    toast.success("笔记已删除");
    router.push("/dashboard/notes");
  }, [id, router]);

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="h-full">
      <NoteEditor
        noteId={note.id}
        initialTitle={note.title}
        initialContent={note.content}
        initialTags={note.tags}
        initialSummary={note.summary}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}