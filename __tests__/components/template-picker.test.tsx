// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplatePicker } from "@/components/notes/template-picker";
import { NOTE_TEMPLATES } from "@/lib/note-templates";

describe("TemplatePicker", () => {
  it("renders all templates with heading", () => {
    render(<TemplatePicker selectedId="blank" onSelect={vi.fn()} />);

    expect(screen.getByText("选择模板")).toBeTruthy();

    for (const template of NOTE_TEMPLATES) {
      expect(screen.getByText(template.name)).toBeTruthy();
      expect(screen.getByText(template.description)).toBeTruthy();
    }
  });

  it("calls onSelect with clicked template", () => {
    const onSelect = vi.fn();
    render(<TemplatePicker selectedId="blank" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /会议记录/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      NOTE_TEMPLATES.find((t) => t.id === "meeting")
    );
  });

  it("highlights selected template", () => {
    render(<TemplatePicker selectedId="reading" onSelect={vi.fn()} />);

    const selectedButton = screen
      .getByText("读书笔记")
      .closest("button") as HTMLButtonElement;
    const blankButton = screen
      .getByText("空白笔记")
      .closest("button") as HTMLButtonElement;

    expect(selectedButton.className).toContain("border-primary");
    expect(blankButton.className).toContain("border-border");
    expect(blankButton.className).not.toContain("border-primary");
  });
});