// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MarkdownViewer } from "@/components/notes/markdown-viewer";

vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockMarkdownPreview({ source }: { source: string }) {
      return <div data-testid="markdown-preview">{source}</div>;
    };
  },
}));

describe("MarkdownViewer", () => {
  it("renders markdown content", async () => {
    render(<MarkdownViewer content="# Hello\n\n**World**" />);

    await waitFor(() => {
      expect(screen.getByTestId("markdown-preview")).toBeTruthy();
    });

    expect(screen.getByTestId("markdown-preview").textContent).toContain(
      "# Hello"
    );
    expect(screen.getByTestId("markdown-preview").textContent).toContain(
      "**World**"
    );
  });
});