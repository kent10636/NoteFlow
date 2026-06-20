// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { NoteShareButton } from "@/components/notes/note-share-button";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from "sonner";

describe("NoteShareButton", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    writeText.mockResolvedValue(undefined);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders 公开分享 when not published", () => {
    render(<NoteShareButton noteId="note-1" />);

    expect(screen.getByRole("button", { name: /公开分享/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /复制链接/ })).toBeNull();
  });

  it("toggle publish calls API and shows copy link", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const onPublishedChange = vi.fn();
    render(
      <NoteShareButton
        noteId="note-1"
        onPublishedChange={onPublishedChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /公开分享/ }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/notes/note-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });
    });

    expect(screen.getByRole("button", { name: /已公开/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /复制链接/ })).toBeTruthy();
    expect(onPublishedChange).toHaveBeenCalledWith(true);
    expect(toast.success).toHaveBeenCalledWith("笔记已公开");
  });

  it("copy link writes share URL to clipboard", async () => {
    render(<NoteShareButton noteId="note-1" initialPublished />);

    fireEvent.click(screen.getByRole("button", { name: /复制链接/ }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/share/note-1`
      );
    });

    expect(toast.success).toHaveBeenCalledWith("分享链接已复制");
  });

  it("toggle error shows toast.error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<NoteShareButton noteId="note-1" />);

    fireEvent.click(screen.getByRole("button", { name: /公开分享/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("更新分享状态失败");
    });
  });
});