// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NoteCard } from "@/components/notes/note-card";

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
  formatDistanceToNow: () => "2天前",
}));

describe("NoteCard", () => {
  it("renders title, tags, and summary", () => {
    render(
      <NoteCard
        id="note-1"
        title="测试笔记"
        summary="这是摘要"
        content="完整内容"
        tags={["工作", "重要", "AI", "隐藏"]}
        updatedAt="2026-06-01T00:00:00.000Z"
      />
    );

    expect(screen.getByText("测试笔记")).toBeTruthy();
    expect(screen.getByText("这是摘要")).toBeTruthy();
    expect(screen.getByText("2天前")).toBeTruthy();
    expect(screen.getByText("工作")).toBeTruthy();
    expect(screen.getByText("重要")).toBeTruthy();
    expect(screen.getByText("AI")).toBeTruthy();
    expect(screen.getByText("+1")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/dashboard/notes/note-1"
    );
  });

  it("falls back to content preview when summary is missing", () => {
    render(
      <NoteCard
        id="note-2"
        title="无摘要笔记"
        content={"A".repeat(150)}
        tags={[]}
        updatedAt="2026-06-01T00:00:00.000Z"
      />
    );

    expect(screen.getByText("A".repeat(120))).toBeTruthy();
  });
});