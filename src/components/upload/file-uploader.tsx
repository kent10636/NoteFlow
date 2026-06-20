"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Image, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FileUploaderProps {
  noteId?: string;
  onUploadComplete?: (data: {
    ocrText: string;
    url: string;
    noteId?: string;
  }) => void;
}

export function FileUploader({ noteId, onUploadComplete }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (noteId) formData.append("noteId", noteId);
        formData.append("createNote", (!noteId).toString());

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }

        const data = await res.json();
        toast.success("文件上传成功" + (data.ocrText ? "，已提取文本" : ""));

        onUploadComplete?.({
          ocrText: data.ocrText ?? "",
          url: data.attachment.url,
          noteId: data.note?.id,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "上传失败"
        );
      } finally {
        setUploading(false);
      }
    },
    [noteId, onUploadComplete]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <Card
      className={`border-dashed transition-colors ${dragOver ? "border-primary bg-primary/5" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <CardContent className="flex flex-col items-center gap-4 py-8">
        <div className="flex gap-4 text-muted-foreground">
          <Image className="h-8 w-8" />
          <FileText className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="font-medium">拖拽文件到此处上传</p>
          <p className="mt-1 text-sm text-muted-foreground">
            支持 JPG、PNG、WebP、PDF，最大 10MB，自动 OCR 提取文字
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
          disabled={uploading}
        />
        <Button
          variant="outline"
          disabled={uploading}
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? "处理中..." : "选择文件"}
        </Button>
      </CardContent>
    </Card>
  );
}