// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SearchBar } from "@/components/search/search-bar";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from "sonner";

const searchResults = [
  {
    id: "note-1",
    title: "机器学习笔记",
    content: "关于深度学习的内容",
    summary: "深度学习摘要",
    tags: ["AI", "ML"],
    similarity: 0.87,
  },
];

describe("SearchBar", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(toast.info).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submit with empty query does nothing", () => {
    render(<SearchBar />);

    fireEvent.click(screen.getByRole("button", { name: /语义搜索/ }));

    expect(fetch).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("submit calls /api/search POST", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: searchResults }),
    } as Response);

    render(<SearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText(/用自然语言搜索你的笔记/),
      { target: { value: "机器学习" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /语义搜索/ }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "机器学习" }),
      });
    });
  });

  it("shows results with title and similarity badge", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: searchResults }),
    } as Response);

    render(<SearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText(/用自然语言搜索你的笔记/),
      { target: { value: "机器学习" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /语义搜索/ }));

    await waitFor(() => {
      expect(screen.getByText("机器学习笔记")).toBeTruthy();
    });

    expect(screen.getByText("87% 匹配")).toBeTruthy();
    expect(screen.getByText("找到 1 条相关笔记")).toBeTruthy();
    expect(screen.getByText("AI")).toBeTruthy();
  });

  it("empty results shows toast.info", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);

    render(<SearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText(/用自然语言搜索你的笔记/),
      { target: { value: "不存在的内容" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /语义搜索/ }));

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith("未找到相关笔记");
    });
  });

  it("error shows toast.error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<SearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText(/用自然语言搜索你的笔记/),
      { target: { value: "测试" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /语义搜索/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("搜索失败");
    });
  });
});