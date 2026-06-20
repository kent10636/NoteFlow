// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/notes",
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

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        name: "测试用户",
        email: "test@example.com",
        image: null,
      },
    },
  }),
  signOut: vi.fn(),
}));

describe("Sidebar", () => {
  it("renders navigation links", () => {
    render(<Sidebar />);

    expect(screen.getByText("NoteFlow")).toBeTruthy();
    expect(screen.getByRole("link", { name: /仪表盘/ }).getAttribute("href")).toBe(
      "/dashboard"
    );
    expect(screen.getByRole("link", { name: /我的笔记/ }).getAttribute("href")).toBe(
      "/dashboard/notes"
    );
    expect(screen.getByRole("link", { name: /新建笔记/ }).getAttribute("href")).toBe(
      "/dashboard/notes/new"
    );
    expect(screen.getByRole("link", { name: /文件上传/ }).getAttribute("href")).toBe(
      "/dashboard/upload"
    );
    expect(screen.getByRole("link", { name: /语义搜索/ }).getAttribute("href")).toBe(
      "/dashboard/search"
    );
    expect(screen.getByRole("link", { name: /知识图谱/ }).getAttribute("href")).toBe(
      "/dashboard/graph"
    );
    expect(screen.getByRole("link", { name: /标签管理/ }).getAttribute("href")).toBe(
      "/dashboard/tags"
    );
    expect(screen.getByRole("link", { name: /每日回顾/ }).getAttribute("href")).toBe(
      "/dashboard/review"
    );
    expect(screen.getByRole("link", { name: /设置/ }).getAttribute("href")).toBe(
      "/dashboard/settings"
    );
    expect(screen.getByText("测试用户")).toBeTruthy();
    expect(screen.getByText("test@example.com")).toBeTruthy();
  });
});