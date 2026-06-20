// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { KnowledgeGraph } from "@/components/graph/knowledge-graph";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("reactflow", async () => {
  const { useState } = await import("react");
  return {
    default: ({
      children,
      onNodeClick,
      nodes,
    }: {
      children?: React.ReactNode;
      onNodeClick?: (e: React.MouseEvent, node: { id: string }) => void;
      nodes?: { id: string }[];
    }) => (
      <div data-testid="react-flow" data-node-count={nodes?.length ?? 0}>
        {nodes?.map((n) => (
          <button
            key={n.id}
            data-testid={`node-${n.id}`}
            onClick={(e) => onNodeClick?.(e, n)}
          >
            {n.id}
          </button>
        ))}
        {children}
      </div>
    ),
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Panel: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="panel">{children}</div>
    ),
    useNodesState: (initial: unknown[]) => {
      const [nodes, setNodes] = useState(initial);
      return [nodes, setNodes, vi.fn()];
    },
    useEdgesState: (initial: unknown[]) => {
      const [edges, setEdges] = useState(initial);
      return [edges, setEdges, vi.fn()];
    },
  };
});

vi.mock("@/components/graph/graph-note-node", () => ({ default: () => null }));
vi.mock("reactflow/dist/style.css", () => ({}));

const graphData = {
  nodes: [
    { id: "n1", label: "笔记一", tags: ["AI"] },
    { id: "n2", label: "笔记二", tags: [] },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", strength: 0.9 }],
};

function mockGraphFetch(data: { nodes: unknown[]; edges: unknown[] }) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

describe("KnowledgeGraph", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows skeleton while loading", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}) as Promise<Response>);

    render(<KnowledgeGraph />);

    expect(document.querySelector('[data-slot="skeleton"]')).toBeTruthy();
    expect(screen.queryByTestId("react-flow")).toBeNull();
  });

  it("shows empty state when graph has no nodes", async () => {
    mockGraphFetch({ nodes: [], edges: [] });

    render(<KnowledgeGraph />);

    await waitFor(() => {
      expect(
        screen.getByText(/暂无知识图谱数据/)
      ).toBeTruthy();
    });

    expect(screen.queryByTestId("react-flow")).toBeNull();
    expect(fetch).toHaveBeenCalledWith("/api/graph");
  });

  it("renders graph with nodes and stats badges", async () => {
    mockGraphFetch(graphData);

    render(<KnowledgeGraph />);

    await waitFor(() => {
      expect(screen.getByTestId("react-flow")).toBeTruthy();
    });

    expect(screen.getByTestId("react-flow").getAttribute("data-node-count")).toBe(
      "2"
    );
    expect(screen.getByText("2 节点")).toBeTruthy();
    expect(screen.getByText("1 关联")).toBeTruthy();
    expect(screen.getByText("实线 = 笔记关联")).toBeTruthy();
    expect(screen.getByText("虚线 = 标签关联")).toBeTruthy();
    expect(screen.getByTestId("node-n1")).toBeTruthy();
    expect(screen.getByTestId("node-n2")).toBeTruthy();
  });

  it("falls back to empty state on fetch error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network"));

    render(<KnowledgeGraph />);

    await waitFor(() => {
      expect(screen.getByText(/暂无知识图谱数据/)).toBeTruthy();
    });

    expect(screen.queryByTestId("react-flow")).toBeNull();
  });

  it("falls back to empty state on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "未授权" }),
    } as Response);

    render(<KnowledgeGraph />);

    await waitFor(() => {
      expect(screen.getByText(/暂无知识图谱数据/)).toBeTruthy();
    });
  });

  it("refetches when refresh button is clicked in empty state", async () => {
    mockGraphFetch({ nodes: [], edges: [] });

    render(<KnowledgeGraph />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /刷新/ }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenCalledWith("/api/graph");
  });

  it("refetches when refresh button is clicked in graph view", async () => {
    mockGraphFetch(graphData);

    render(<KnowledgeGraph />);

    await waitFor(() => expect(screen.getByTestId("react-flow")).toBeTruthy());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const panel = screen.getByTestId("panel");
    const refreshButton = panel.querySelector("button");
    expect(refreshButton).toBeTruthy();
    fireEvent.click(refreshButton!);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("navigates to note page on node click", async () => {
    mockGraphFetch(graphData);

    render(<KnowledgeGraph />);

    await waitFor(() => expect(screen.getByTestId("node-n1")).toBeTruthy());

    fireEvent.click(screen.getByTestId("node-n1"));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/notes/n1");
  });
});