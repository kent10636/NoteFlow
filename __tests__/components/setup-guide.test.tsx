// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SetupGuide } from "@/components/onboarding/setup-guide";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const setupStatus = {
  showOnboarding: true,
  isFirstTime: true,
  noteCount: 0,
  steps: [
    { id: "env", title: "配置环境变量", done: false },
    { id: "note", title: "创建第一条笔记", done: false, href: "/dashboard/notes/new" },
    { id: "ai", title: "配置 AI 密钥", done: true },
  ],
  env: {
    valid: false,
    missing: ["DATABASE_URL"],
    warnings: ["未配置 OCR"],
    optional: [],
  },
};

describe("SetupGuide", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches setup status and renders steps", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => setupStatus,
    } as Response);

    render(<SetupGuide />);

    await waitFor(() => {
      expect(screen.getByText("欢迎使用 NoteFlow！")).toBeTruthy();
    });

    expect(fetch).toHaveBeenCalledWith("/api/setup/status");
    expect(screen.getByText("配置环境变量")).toBeTruthy();
    expect(screen.getAllByText("创建第一条笔记").length).toBeGreaterThan(0);
    expect(screen.getByText("配置 AI 密钥")).toBeTruthy();
    expect(screen.getByText("缺少必要环境变量")).toBeTruthy();
    expect(screen.getByText("• DATABASE_URL")).toBeTruthy();
    expect(screen.getByText("未配置 OCR")).toBeTruthy();
    const createNoteLinks = screen.getAllByRole("link", {
      name: /创建第一条笔记/,
    });
    expect(
      createNoteLinks.some(
        (link) => link.getAttribute("href") === "/dashboard/notes/new"
      )
    ).toBe(true);
  });

  it("renders nothing when onboarding is hidden", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ...setupStatus, showOnboarding: false }),
    } as Response);

    const { container } = render(<SetupGuide />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(container.firstChild).toBeNull();
  });
});