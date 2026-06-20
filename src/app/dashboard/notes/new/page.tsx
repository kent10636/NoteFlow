"use client";

import { useRouter } from "next/navigation";
import { NoteEditor } from "@/components/notes/note-editor";

export default function NewNotePage() {
  const router = useRouter();

  const handleSave = async (data: {
    title: string;
    content: string;
    tags: string[];
  }) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error();

    const note = await res.json();
    router.push(`/dashboard/notes/${note.id}`);
  };

  return (
    <div className="h-full">
      <NoteEditor onSave={handleSave} />
    </div>
  );
}