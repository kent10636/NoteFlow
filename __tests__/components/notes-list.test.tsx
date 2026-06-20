// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotesList } from "@/components/notes/notes-list";

const { mockPush, mockRefresh, mockGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => ({ get: mockGet }),
}));

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
  },
}));

vi.mock("@/lib/date", () => ({
  formatDistanceToNow: () => "1天前",
}));

import { toast } from "sonner";

const notes = [
  {
    id: "n1",
    title: "笔记一",
    content: "内容一",
    summary: "摘要一",
    tags: ["工作", "重要"],
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "n2",
    title: "笔记二",
    content: "内容二",
    summary: null,
    tags: ["学习"],
    updatedAt: "2026-06-02T00:00:00.000Z",
  },
  {
    id: "n3",
    title: "笔记三",
    content: "内容三",
    summary: "摘要三",
    tags: ["工作"],
    updatedAt: "2026-06-03T00:00:00.000Z",
  },
];

describe("NotesList", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => true));
    mockGet.mockReturnValue(null);
    mockPush.mockClear();
    mockRefresh.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("filters notes by tag from searchParams", () => {
    mockGet.mockReturnValue("工作");

    render(<NotesList notes={notes} />);

    expect(screen.getByText("筛选标签：")).toBeTruthy();
    expect(screen.getAllByText("工作").length).toBeGreaterThan(0);
    expect(screen.getByText("2 条结果")).toBeTruthy();
    expect(screen.getByText("笔记一")).toBeTruthy();
    expect(screen.getByText("笔记三")).toBeTruthy();
    expect(screen.queryByText("笔记二")).toBeNull();
  });

  it("clears tag filter when badge close is clicked", () => {
    mockGet.mockReturnValue("工作");

    render(<NotesList notes={notes} />);

    fireEvent.click(screen.getByLabelText("清除筛选"));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/notes");
  });

  it("enters batch selection mode and selects notes", () => {
    render(<NotesList notes={notes} />);

    fireEvent.click(screen.getByRole("button", { name: /批量选择/ }));

    expect(screen.getByRole("button", { name: /全选/ })).toBeTruthy();
    expect(screen.getByText("已选 0 条")).toBeTruthy();

    fireEvent.click(screen.getAllByLabelText("选择笔记")[0]);
    expect(screen.getByText("已选 1 条")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /全选/ }));
    expect(screen.getByText("已选 3 条")).toBeTruthy();
  });

  it("calls batch delete API when confirmed", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ affected: 1 }),
    } as Response);

    render(<NotesList notes={notes} />);

    fireEvent.click(screen.getByRole("button", { name: /批量选择/ }));
    fireEvent.click(screen.getAllByLabelText("选择笔记")[0]);
    fireEvent.click(screen.getByRole("button", { name: /^删除$/ }));

    expect(confirm).toHaveBeenCalledWith("确定删除 1 条笔记？");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/notes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          noteIds: ["n1"],
        }),
      });
    });

    expect(toast.success).toHaveBeenCalledWith("已处理 1 条笔记");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("opens tag dialog and submits add tags batch action", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ affected: 2 }),
    } as Response);

    render(<NotesList notes={notes} />);

    fireEvent.click(screen.getByRole("button", { name: /批量选择/ }));
    fireEvent.click(screen.getAllByLabelText("选择笔记")[0]);
    fireEvent.click(screen.getAllByLabelText("选择笔记")[0]);
    fireEvent.click(screen.getByRole("button", { name: /添加标签/ }));

    expect(screen.getByText("批量添加标签")).toBeTruthy();
    expect(screen.getByText(/将应用于 2 条笔记/)).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("例如：工作, 重要"), {
      target: { value: "新标签, 测试" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^确认$/ }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/notes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addTags",
          noteIds: ["n1", "n2"],
          tags: ["新标签", "测试"],
        }),
      });
    });

    expect(toast.success).toHaveBeenCalledWith("已处理 2 条笔记");
  });

  it("opens remove tags dialog", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ affected: 1 }),
    } as Response);

    render(<NotesList notes={notes} />);

    fireEvent.click(screen.getByRole("button", { name: /批量选择/ }));
    fireEvent.click(screen.getAllByLabelText("选择笔记")[0]);
    fireEvent.click(screen.getByRole("button", { name: /移除标签/ }));

    expect(screen.getByText("批量移除标签")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("例如：工作, 重要"), {
      target: { value: "工作" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^确认$/ }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/notes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeTags",
          noteIds: ["n1"],
          tags: ["工作"],
        }),
      });
    });
  });
});