// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useWikiLinkAutocomplete } from "@/components/notes/wiki-link-autocomplete";

const titles = [
  { id: "1", title: "机器学习入门" },
  { id: "2", title: "前端笔记" },
  { id: "3", title: "React 学习" },
];

function AutocompleteHarness({
  noteId,
  onContentChange,
}: {
  noteId?: string;
  onContentChange: (value: string) => void;
}) {
  const { textareaProps, AutocompleteList } = useWikiLinkAutocomplete({
    noteId,
    onContentChange,
  });

  return (
    <div>
      <textarea
        className="w-md-editor-text-input"
        defaultValue=""
        {...textareaProps}
      />
      {AutocompleteList}
    </div>
  );
}

describe("useWikiLinkAutocomplete", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches note titles on mount", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => titles,
    } as Response);

    const onContentChange = vi.fn();
    render(<AutocompleteHarness onContentChange={onContentChange} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/notes/titles");
    });
  });

  it("detects wiki link trigger and shows autocomplete options", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => titles,
    } as Response);

    const onContentChange = vi.fn();
    render(<AutocompleteHarness noteId="2" onContentChange={onContentChange} />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: "参见 [[机器" } });
    Object.defineProperty(textarea, "selectionStart", {
      value: "参见 [[机器".length,
      configurable: true,
    });
    fireEvent.keyUp(textarea);

    await waitFor(() => {
      expect(screen.getByText("选择要链接的笔记（↑↓ 选择，Enter 确认）")).toBeTruthy();
    });

    expect(screen.getByText("机器学习入门")).toBeTruthy();
    expect(screen.queryByText("前端笔记")).toBeNull();
  });

  it("inserts selected wiki link on Enter", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => titles,
    } as Response);

    const onContentChange = vi.fn();
    render(<AutocompleteHarness onContentChange={onContentChange} />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: "参见 [[机器" } });
    Object.defineProperty(textarea, "selectionStart", {
      value: "参见 [[机器".length,
      configurable: true,
    });
    fireEvent.keyUp(textarea);

    await waitFor(() => {
      expect(screen.getByText("机器学习入门")).toBeTruthy();
    });

    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(onContentChange).toHaveBeenCalledWith("参见 [[机器学习入门]]");
  });
});