// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { FileUploader } from "@/components/upload/file-uploader";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from "sonner";

const mockUploadResponse = {
  ocrText: "提取的文字",
  attachment: { url: "https://example.com/file.pdf" },
  note: { id: "new-note-1" },
};

function createFile(name = "test.pdf", type = "application/pdf") {
  return new File(["content"], name, { type });
}

async function formDataEntries(fd: FormData): Promise<Record<string, string>> {
  const entries: Record<string, string> = {};
  for (const [key, value] of fd.entries()) {
    entries[key] = value instanceof File ? value.name : String(value);
  }
  return entries;
}

function getUploadFormData(callIndex = 0): FormData {
  const [, options] = vi.mocked(fetch).mock.calls[callIndex] as [
    string,
    { method: string; body: FormData },
  ];
  return options.body;
}

function uploadViaFileInput(file: File) {
  const fileInput = document.querySelector(
    'input[type="file"][accept*="pdf"]'
  ) as HTMLInputElement;
  fireEvent.change(fileInput, { target: { files: [file] } });
}

describe("FileUploader", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders upload UI text", () => {
    render(<FileUploader />);

    expect(screen.getByText("拖拽文件到此处上传")).toBeTruthy();
    expect(
      screen.getByText("支持 JPG、PNG、WebP、PDF，最大 10MB，自动 OCR 提取文字")
    ).toBeTruthy();
    expect(screen.getByText("选择文件")).toBeTruthy();
    expect(screen.getByText("上传后自动创建笔记")).toBeTruthy();
  });

  it("file input triggers fetch to /api/upload", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockUploadResponse,
    } as Response);

    render(<FileUploader />);
    uploadViaFileInput(createFile());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/upload", {
        method: "POST",
        body: expect.any(FormData),
      });
    });
  });

  it("with noteId sends noteId and no createNote", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockUploadResponse,
    } as Response);

    render(<FileUploader noteId="note-123" />);
    uploadViaFileInput(createFile());

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const entries = await formDataEntries(getUploadFormData());
    expect(entries.noteId).toBe("note-123");
    expect(entries.createNote).toBeUndefined();
    expect(screen.queryByText("上传后自动创建笔记")).toBeNull();
  });

  it("without noteId sends createNote true by default", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockUploadResponse,
    } as Response);

    render(<FileUploader />);
    uploadViaFileInput(createFile());

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const entries = await formDataEntries(getUploadFormData());
    expect(entries.createNote).toBe("true");
    expect(entries.noteId).toBeUndefined();
  });

  it("without noteId sends createNote false when checkbox unchecked", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockUploadResponse,
    } as Response);

    render(<FileUploader />);

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    uploadViaFileInput(createFile());

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const entries = await formDataEntries(getUploadFormData());
    expect(entries.createNote).toBe("false");
  });

  it("success calls onUploadComplete", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockUploadResponse,
    } as Response);

    const onUploadComplete = vi.fn();
    render(<FileUploader onUploadComplete={onUploadComplete} />);
    uploadViaFileInput(createFile());

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith({
        ocrText: "提取的文字",
        url: "https://example.com/file.pdf",
        noteId: "new-note-1",
      });
    });

    expect(toast.success).toHaveBeenCalledWith("文件上传成功，已提取文本");
  });

  it("error shows toast.error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "文件过大" }),
    } as Response);

    render(<FileUploader />);
    uploadViaFileInput(createFile());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("文件过大");
    });
  });

  it("uploading state shows 处理中...", async () => {
    let resolveUpload!: (value: Response) => void;
    const uploadPromise = new Promise<Response>((resolve) => {
      resolveUpload = resolve;
    });
    vi.mocked(fetch).mockReturnValue(uploadPromise);

    render(<FileUploader />);
    uploadViaFileInput(createFile());

    await waitFor(() => {
      expect(screen.getByText("处理中...")).toBeTruthy();
    });

    resolveUpload({
      ok: true,
      json: async () => mockUploadResponse,
    } as Response);

    await waitFor(() => {
      expect(screen.getByText("选择文件")).toBeTruthy();
    });
  });
});