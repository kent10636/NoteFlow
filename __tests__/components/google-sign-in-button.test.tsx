// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const { mockSignIn } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}));

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    mockSignIn.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders button when Google provider is available", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ google: { id: "google" } }),
    } as Response);

    render(<GoogleSignInButton />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /使用 Google 登录/ })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /使用 Google 登录/ }));

    expect(mockSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/dashboard",
    });
  });

  it("renders nothing when Google provider is unavailable", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const { container } = render(<GoogleSignInButton />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(container.firstChild).toBeNull();
  });
});