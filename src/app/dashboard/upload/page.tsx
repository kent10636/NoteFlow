import { Upload } from "lucide-react";
import { FileUploader } from "@/components/upload/file-uploader";

export default function UploadPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Upload className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">文件上传</h1>
            <p className="mt-1 text-muted-foreground">
              上传 PDF 或图片，自动 OCR 提取文字并创建笔记
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-xl">
        <FileUploader />
      </div>
    </div>
  );
}