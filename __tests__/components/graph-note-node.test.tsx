// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GraphNoteNode from "@/components/graph/graph-note-node";

vi.mock("reactflow", () => ({
  Handle: ({
    type,
    position,
    id,
  }: {
    type: string;
    position: string;
    id: string;
  }) => (
    <div
      data-testid="handle"
      data-type={type}
      data-position={position}
      data-id={id}
    />
  ),
  Position: {
    Top: "top",
    Right: "right",
    Bottom: "bottom",
    Left: "left",
  },
}));

describe("GraphNoteNode", () => {
  it("renders label and handle nodes on all sides", () => {
    render(
      <GraphNoteNode
        id="n1"
        data={{ label: "测试节点", borderColor: "#ff0000" }}
        selected={false}
        type="note"
        zIndex={0}
        isConnectable
        xPos={0}
        yPos={0}
        dragging={false}
      />
    );

    expect(screen.getByText("测试节点")).toBeTruthy();

    const handles = screen.getAllByTestId("handle");
    expect(handles).toHaveLength(8);

    const sides = ["top", "right", "bottom", "left"];
    for (const side of sides) {
      expect(
        handles.some(
          (h) =>
            h.getAttribute("data-type") === "target" &&
            h.getAttribute("data-position") === side &&
            h.getAttribute("data-id") === `${side}-t`
        )
      ).toBe(true);
      expect(
        handles.some(
          (h) =>
            h.getAttribute("data-type") === "source" &&
            h.getAttribute("data-position") === side &&
            h.getAttribute("data-id") === `${side}-s`
        )
      ).toBe(true);
    }
  });
});