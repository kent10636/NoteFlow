"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  clampSelectedIndex,
  detectWikiLinkTrigger,
  filterNoteTitles,
  insertWikiLink,
  type NoteTitleOption,
} from "@/lib/wikilink-autocomplete";

const TEXTAREA_SELECTOR = ".w-md-editor-text-input";

export function useWikiLinkAutocomplete({
  noteId,
  onContentChange,
}: {
  noteId?: string;
  onContentChange: (value: string) => void;
}) {
  const [titles, setTitles] = useState<NoteTitleOption[]>([]);
  const [trigger, setTrigger] = useState<ReturnType<
    typeof detectWikiLinkTrigger
  > | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

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

  const stateRef = useRef({ trigger, options, selectedIndex });
  stateRef.current = { trigger, options, selectedIndex };

  const applySelection = useCallback(
    (title: string, textarea: HTMLTextAreaElement) => {
      const cursor = textarea.selectionStart ?? 0;
      const activeTrigger =
        detectWikiLinkTrigger(textarea.value, cursor) ??
        stateRef.current.trigger;
      if (!activeTrigger) return;

      const { nextContent, nextCursor } = insertWikiLink(
        textarea.value,
        activeTrigger,
        title
      );
      onContentChangeRef.current(nextContent);
      setTrigger(null);
      setSelectedIndex(0);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
      });
    },
    []
  );

  const syncFromTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    const next = detectWikiLinkTrigger(
      textarea.value,
      textarea.selectionStart ?? 0
    );
    setTrigger(next);
    if (next) setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement)) return;
      if (!target.matches(TEXTAREA_SELECTOR)) return;

      const { trigger: activeTrigger, options: activeOptions, selectedIndex: index } =
        stateRef.current;
      if (!activeTrigger || activeOptions.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        setSelectedIndex((current) =>
          clampSelectedIndex(current + 1, activeOptions.length)
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        setSelectedIndex((current) =>
          clampSelectedIndex(current - 1, activeOptions.length)
        );
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setTrigger(null);
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        const selected = activeOptions[index];
        if (selected) {
          applySelection(selected.title, target);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [applySelection]);

  const textareaProps = {
    onKeyUp: (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
      syncFromTextarea(event.currentTarget),
    onClick: (event: React.MouseEvent<HTMLTextAreaElement>) =>
      syncFromTextarea(event.currentTarget),
    onSelect: (event: React.SyntheticEvent<HTMLTextAreaElement>) =>
      syncFromTextarea(event.currentTarget),
    onInput: (event: React.FormEvent<HTMLTextAreaElement>) =>
      syncFromTextarea(event.currentTarget),
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
                    TEXTAREA_SELECTOR
                  );
                  if (textarea) applySelection(option.title, textarea);
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