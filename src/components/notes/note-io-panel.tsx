"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ImportFormat = "json" | "markdown";

export function NoteIoPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFormat, setImportFormat] = useState<ImportFormat>("json");

  const handleExport = (format: "json" | "markdown") => {
    window.location.href = `/api/notes/export?format=${format}`;
    toast.success(format === "json" ? "正在导出 JSON" : "正在导出 Markdown");
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const form = new FormData();
      form.append("format", importFormat);
      form.append("file", file);

      const res = await fetch("/api/notes/import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "导入失败");
      }

      toast.success(`成功导入 ${data.imported} 条笔记`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导入失败");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导入 / 导出
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入 / 导出笔记</DialogTitle>
          <DialogDescription>
            备份或迁移你的笔记库，支持 JSON 与 Markdown 格式。
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">导出</TabsTrigger>
            <TabsTrigger value="import">导入</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              JSON 包含完整元数据，适合备份还原；Markdown 便于在其他编辑器中阅读。
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => handleExport("json")}
              >
                <Download className="h-4 w-4" />
                导出 JSON 备份
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => handleExport("markdown")}
              >
                <Download className="h-4 w-4" />
                导出 Markdown 合集
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>文件格式</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={importFormat === "json" ? "default" : "outline"}
                  onClick={() => setImportFormat("json")}
                >
                  JSON
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={importFormat === "markdown" ? "default" : "outline"}
                  onClick={() => setImportFormat("markdown")}
                >
                  Markdown
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={importFormat === "json" ? ".json,application/json" : ".md,.markdown,text/markdown"}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />

            <Button
              className="w-full gap-2"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {importing ? "导入中..." : "选择文件并导入"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}