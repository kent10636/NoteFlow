"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NoteEditor } from "@/components/notes/note-editor";
import { TemplatePicker } from "@/components/notes/template-picker";
import { getNoteTemplate } from "@/lib/note-templates";

export default function NewNotePage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("blank");
  const template = getNoteTemplate(templateId);

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
    <div className="flex h-full flex-col">
      <TemplatePicker
        selectedId={templateId}
        onSelect={(t) => setTemplateId(t.id)}
      />
      <div className="flex-1">
        <NoteEditor
          key={templateId}
          initialTitle={template.title}
          initialContent={template.content}
          initialTags={template.tags}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}