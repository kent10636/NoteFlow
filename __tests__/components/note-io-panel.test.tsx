// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { NoteIoPanel } from "@/components/notes/note-io-panel";

const { mockRefresh } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from "sonner";

function createJsonFile() {
  return new File(['{"notes":[]}'], "backup.json", {
    type: "application/json",
  });
}

describe("NoteIoPanel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    mockRefresh.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();

    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders trigger button "导入 / 导出"', () => {
    render(<NoteIoPanel />);
    expect(screen.getByRole("button", { name: /导入 \/ 导出/ })).toBeTruthy();
  });

  it("export JSON sets window.location.href", () => {
    render(<NoteIoPanel />);

    fireEvent.click(screen.getByRole("button", { name: /导入 \/ 导出/ }));
    fireEvent.click(screen.getByRole("button", { name: /导出 JSON 备份/ }));

    expect(window.location.href).toBe("/api/notes/export?format=json");
    expect(toast.success).toHaveBeenCalledWith("正在导出 JSON");
  });

  it("import success calls fetch /api/notes/import and router.refresh", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ imported: 3 }),
    } as Response);

    render(<NoteIoPanel />);

    fireEvent.click(screen.getByRole("button", { name: /导入 \/ 导出/ }));
    fireEvent.click(screen.getByRole("tab", { name: "导入" }));

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createJsonFile()] } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/notes/import", {
        method: "POST",
        body: expect.any(FormData),
      });
    });

    expect(mockRefresh).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("成功导入 3 条笔记");
  });

  it("import error shows toast.error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "格式无效" }),
    } as Response);

    render(<NoteIoPanel />);

    fireEvent.click(screen.getByRole("button", { name: /导入 \/ 导出/ }));
    fireEvent.click(screen.getByRole("tab", { name: "导入" }));

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [createJsonFile()] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("格式无效");
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });
});