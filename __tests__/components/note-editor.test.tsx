// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NoteEditor } from "@/components/notes/note-editor";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockMDEditor({
      value,
      onChange,
    }: {
      value: string;
      onChange: (v: string) => void;
    }) {
      return (
        <textarea
          data-testid="md-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
}));

vi.mock("@/components/notes/backlinks-panel", () => ({
  BacklinksPanel: () => <div data-testid="backlinks-panel" />,
}));
vi.mock("@/components/notes/note-share-button", () => ({
  NoteShareButton: () => <button type="button">分享</button>,
}));
vi.mock("@/components/notes/wiki-link-hint", () => ({
  WikiLinkHint: () => <div data-testid="wiki-link-hint" />,
}));
vi.mock("@/components/notes/wiki-link-autocomplete", () => ({
  useWikiLinkAutocomplete: () => ({
    textareaProps: {},
    AutocompleteList: null,
  }),
}));
vi.mock("@/components/upload/file-uploader", () => ({
  FileUploader: () => <div data-testid="file-uploader" />,
}));

import { toast } from "sonner";

describe("NoteEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders title input and save button", () => {
    render(<NoteEditor initialTitle="我的笔记" />);
    expect(
      (screen.getByPlaceholderText("笔记标题...") as HTMLInputElement).value
    ).toBe("我的笔记");
    expect(screen.getByText("保存")).toBeTruthy();
  });

  it("shows error when saving without title", async () => {
    render(<NoteEditor onSave={vi.fn()} />);
    fireEvent.click(screen.getByText("保存"));
    expect(toast.error).toHaveBeenCalledWith("请输入笔记标题");
  });

  it("calls onSave with title and content", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <NoteEditor
        initialTitle="标题"
        initialContent="正文"
        initialTags={["tag1"]}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: "标题",
        content: "正文",
        tags: ["tag1"],
      });
    });
    expect(toast.success).toHaveBeenCalledWith("笔记已保存");
  });

  it("blocks AI actions without noteId", async () => {
    render(<NoteEditor initialTitle="标题" />);
    fireEvent.click(screen.getByText("摘要"));
    expect(toast.error).toHaveBeenCalledWith("请先保存笔记后再使用 AI 功能");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls summarize API and shows summary", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ summary: "生成的摘要" }),
    } as Response);

    render(
      <NoteEditor
        noteId="n1"
        initialTitle="标题"
        initialContent="长文"
      />
    );

    fireEvent.click(screen.getByText("摘要"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/ai/summarize", expect.any(Object));
      expect(screen.getByText(/生成的摘要/)).toBeTruthy();
    });
    expect(toast.success).toHaveBeenCalledWith("摘要已生成");
  });

  it("toggles upload panel", () => {
    render(<NoteEditor initialTitle="标题" />);
    expect(screen.queryByTestId("file-uploader")).toBeNull();
    fireEvent.click(screen.getByText("上传"));
    expect(screen.getByTestId("file-uploader")).toBeTruthy();
  });

  it("renders summary and tags section when provided", () => {
    render(
      <NoteEditor
        initialTitle="标题"
        initialSummary="已有摘要"
        initialTags={["AI", "笔记"]}
      />
    );
    expect(screen.getByText(/已有摘要/)).toBeTruthy();
    expect(screen.getByText("AI")).toBeTruthy();
    expect(screen.getByText("笔记")).toBeTruthy();
  });
});