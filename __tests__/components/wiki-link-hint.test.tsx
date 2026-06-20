// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WikiLinkHint } from "@/components/notes/wiki-link-hint";

describe("WikiLinkHint", () => {
  it("renders wiki link usage hint", () => {
    render(<WikiLinkHint />);

    expect(screen.getByText("[[笔记名]]")).toBeTruthy();
    expect(screen.getByText(/创建双向链接/)).toBeTruthy();
    expect(screen.getByText(/知识图谱中显示关联/)).toBeTruthy();
  });
});