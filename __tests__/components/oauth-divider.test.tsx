// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OAuthDivider } from "@/components/auth/oauth-divider";

describe("OAuthDivider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders divider when Google provider is available", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ google: { id: "google" } }),
    } as Response);

    render(<OAuthDivider />);

    await waitFor(() => {
      expect(screen.getByText("或")).toBeTruthy();
    });

    expect(fetch).toHaveBeenCalledWith("/api/auth/providers");
  });

  it("renders nothing when Google provider is unavailable", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const { container } = render(<OAuthDivider />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(container.firstChild).toBeNull();
  });
});