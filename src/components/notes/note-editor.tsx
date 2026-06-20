"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Brain, Save, Sparkles, Tag, Trash2, Upload } from "lucide-react";
import { NoteShareButton } from "@/components/notes/note-share-button";
import { WikiLinkHint } from "@/components/notes/wiki-link-hint";
import { useWikiLinkAutocomplete } from "@/components/notes/wiki-link-autocomplete";
import { FileUploader } from "@/components/upload/file-uploader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

interface NoteEditorProps {
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  initialSummary?: string | null;
  initialPublished?: boolean;
  onSave?: (data: {
    title: string;
    content: string;
    tags: string[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function NoteEditor({
  noteId,
  initialTitle = "",
  initialContent = "",
  initialTags = [],
  initialSummary = null,
  initialPublished = false,
  onSave,
  onDelete,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTags);
  const [summary, setSummary] = useState(initialSummary);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { textareaProps: wikiLinkTextareaProps, AutocompleteList } =
    useWikiLinkAutocomplete({
      noteId,
      onContentChange: setContent,
    });

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error("请输入笔记标题");
      return;
    }
    setSaving(true);
    try {
      await onSave?.({ title, content, tags });
      toast.success("笔记已保存");
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }, [title, content, tags, onSave]);

  const handleAI = useCallback(
    async (action: "summarize" | "tags" | "recommend") => {
      if (!noteId) {
        toast.error("请先保存笔记后再使用 AI 功能");
        return;
      }

      setAiLoading(action);
      try {
        const res = await fetch(`/api/ai/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteId }),
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        if (action === "summarize") {
          setSummary(data.summary);
          toast.success("摘要已生成");
        } else if (action === "tags") {
          setTags(data.tags);
          toast.success("标签已生成");
        } else {
          toast.success(`找到 ${data.recommendations?.length ?? 0} 条相关笔记`);
        }
      } catch {
        toast.error("AI 处理失败");
      } finally {
        setAiLoading(null);
      }
    },
    [noteId]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题..."
          className="border-0 text-xl font-semibold shadow-none focus-visible:ring-0"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAI("summarize")}
            disabled={!!aiLoading}
          >
            <Sparkles className="mr-1 h-4 w-4" />
            {aiLoading === "summarize" ? "生成中..." : "摘要"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAI("tags")}
            disabled={!!aiLoading}
          >
            <Tag className="mr-1 h-4 w-4" />
            {aiLoading === "tags" ? "生成中..." : "标签"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAI("recommend")}
            disabled={!!aiLoading}
          >
            <Brain className="mr-1 h-4 w-4" />
            {aiLoading === "recommend" ? "分析中..." : "推荐"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Upload className="mr-1 h-4 w-4" />
            上传
          </Button>
          {noteId && (
            <NoteShareButton
              noteId={noteId}
              initialPublished={initialPublished}
            />
          )}
          <Separator orientation="vertical" className="h-6" />
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {(summary || tags.length > 0) && (
        <div className="space-y-2 border-b bg-muted/30 px-6 py-3">
          {summary && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">摘要：</span>
              {summary}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {showUpload && (
        <div className="border-b px-6 py-4">
          <FileUploader
            noteId={noteId}
            onUploadComplete={({ ocrText }) => {
              if (ocrText) {
                setContent((prev) => prev + `\n\n## OCR 提取内容\n\n${ocrText}`);
              }
              setShowUpload(false);
            }}
          />
        </div>
      )}

      <WikiLinkHint />
      {AutocompleteList}

      <div className="flex-1 overflow-auto p-4" data-color-mode="light">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val ?? "")}
          textareaProps={wikiLinkTextareaProps}
          height="100%"
          preview="live"
          className="!border-0 !shadow-none"
        />
      </div>
    </div>
  );
}