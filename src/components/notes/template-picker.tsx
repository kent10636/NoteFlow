"use client";

import { cn } from "@/lib/utils";
import { NOTE_TEMPLATES, type NoteTemplate } from "@/lib/note-templates";

interface TemplatePickerProps {
  selectedId: string;
  onSelect: (template: NoteTemplate) => void;
}

export function TemplatePicker({ selectedId, onSelect }: TemplatePickerProps) {
  return (
    <div className="border-b bg-muted/20 px-6 py-4">
      <p className="mb-3 text-sm font-medium">选择模板</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {NOTE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={cn(
              "rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50",
              selectedId === template.id
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <p className="text-sm font-medium">{template.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {template.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}