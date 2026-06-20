"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  clampSelectedIndex,
  detectWikiLinkTrigger,
  filterNoteTitles,
  insertWikiLink,
  type NoteTitleOption,
} from "@/lib/wikilink-autocomplete";

export function useWikiLinkAutocomplete({
  content,
  noteId,
  onContentChange,
}: {
  content: string;
  noteId?: string;
  onContentChange: (value: string) => void;
}) {
  const [titles, setTitles] = useState<NoteTitleOption[]>([]);
  const [trigger, setTrigger] = useState<ReturnType<
    typeof detectWikiLinkTrigger
  > | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetch("/api/notes/titles")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: NoteTitleOption[]) => setTitles(data))
      .catch(() => setTitles([]));
  }, []);

  const options = useMemo(
    () => (trigger ? filterNoteTitles(titles, trigger.query, noteId) : []),
    [titles, trigger, noteId]
  );

  const syncFromTextarea = (textarea: HTMLTextAreaElement) => {
    const next = detectWikiLinkTrigger(
      textarea.value,
      textarea.selectionStart ?? 0
    );
    setTrigger(next);
    if (next) setSelectedIndex(0);
  };

  const applySelection = (
    title: string,
    textarea: HTMLTextAreaElement | null
  ) => {
    if (!textarea) return;

    const cursor = textarea.selectionStart ?? 0;
    const activeTrigger =
      detectWikiLinkTrigger(textarea.value, cursor) ?? trigger;
    if (!activeTrigger) return;

    const { nextContent, nextCursor } = insertWikiLink(
      textarea.value,
      activeTrigger,
      title
    );
    onContentChange(nextContent);
    setTrigger(null);
    setSelectedIndex(0);

    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const textareaProps = {
    onKeyUp: (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
      syncFromTextarea(event.currentTarget),
    onClick: (event: React.MouseEvent<HTMLTextAreaElement>) =>
      syncFromTextarea(event.currentTarget),
    onSelect: (event: React.SyntheticEvent<HTMLTextAreaElement>) =>
      syncFromTextarea(event.currentTarget),
    onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!trigger || options.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) =>
          clampSelectedIndex(index + 1, options.length)
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) =>
          clampSelectedIndex(index - 1, options.length)
        );
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setTrigger(null);
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selected = options[selectedIndex];
        if (selected) {
          applySelection(selected.title, event.currentTarget);
        }
      }
    },
  } as const;

  const AutocompleteList =
    trigger && options.length > 0 ? (
      <div className="mx-4 mb-2 rounded-lg border bg-popover p-1 shadow-md">
        <p className="px-2 py-1 text-xs text-muted-foreground">
          选择要链接的笔记（↑↓ 选择，Enter 确认）
        </p>
        <ul className="max-h-48 overflow-auto">
          {options.map((option, index) => (
            <li key={option.id}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm",
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  const textarea = document.querySelector<HTMLTextAreaElement>(
                    ".w-md-editor-text-input"
                  );
                  applySelection(option.title, textarea);
                }}
              >
                {option.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return { textareaProps, AutocompleteList };
}