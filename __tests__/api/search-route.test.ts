import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/hybrid-search", () => ({
  hybridSearch: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { hybridSearch } from "@/lib/hybrid-search";
import { POST } from "@/app/api/search/route";

const mockAuth = vi.mocked(auth);
const mockSearch = vi.mocked(hybridSearch);

function searchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("search API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(searchRequest({ query: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty query", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    const res = await POST(searchRequest({ query: "   " }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("搜索关键词不能为空");
  });

  it("returns search results for valid query", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockSearch.mockResolvedValue([
      { id: "n1", title: "机器学习", score: 0.9 },
    ] as never);

    const res = await POST(searchRequest({ query: "  机器学习  ", limit: 5 }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(mockSearch).toHaveBeenCalledWith("u1", "机器学习", 5);
  });

  it("uses default limit of 10", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
    mockSearch.mockResolvedValue([]);

    await POST(searchRequest({ query: "test" }));

    expect(mockSearch).toHaveBeenCalledWith("u1", "test", 10);
  });
});