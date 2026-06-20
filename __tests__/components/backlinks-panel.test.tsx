// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BacklinksPanel } from "@/components/notes/backlinks-panel";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/date", () => ({
  formatDistanceToNow: () => "3天前",
}));

describe("BacklinksPanel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing without noteId", () => {
    const { container } = render(<BacklinksPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading then backlinks", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        backlinks: [
          {
            id: "src-1",
            title: "来源笔记",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
        ],
      }),
    } as Response);

    render(<BacklinksPanel noteId="target-1" />);

    expect(screen.getByText("加载中...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("来源笔记")).toBeTruthy();
    });

    expect(screen.getByText("反向链接")).toBeTruthy();
    expect(screen.getByText("(1)")).toBeTruthy();
    expect(screen.getByText("3天前")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/notes/target-1/backlinks");
  });

  it("shows empty state when no backlinks", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ backlinks: [] }),
    } as Response);

    render(<BacklinksPanel noteId="target-1" />);

    await waitFor(() => {
      expect(screen.getByText("暂无其他笔记链接到本篇")).toBeTruthy();
    });
  });

  it("falls back to empty on fetch error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network"));

    render(<BacklinksPanel noteId="target-1" />);

    await waitFor(() => {
      expect(screen.getByText("暂无其他笔记链接到本篇")).toBeTruthy();
    });
  });

  it("falls back to empty on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "未授权" }),
    } as Response);

    render(<BacklinksPanel noteId="target-1" />);

    await waitFor(() => {
      expect(screen.getByText("暂无其他笔记链接到本篇")).toBeTruthy();
    });
  });

  it("refetches when refreshKey changes", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ backlinks: [] }),
    } as Response);

    const { rerender } = render(
      <BacklinksPanel noteId="target-1" refreshKey={0} />
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    rerender(<BacklinksPanel noteId="target-1" refreshKey={1} />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});