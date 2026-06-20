import { describe, it, expect, vi, beforeAll } from "vitest";
import { NextResponse } from "next/server";

const handlers: Array<(req: unknown) => Response> = [];

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    auth: vi.fn((handler: (req: unknown) => Response) => {
      handlers.push(handler);
      return handler;
    }),
  })),
}));

vi.mock("@/lib/auth.config", () => ({ authConfig: {} }));

function mockReq(
  pathname: string,
  isLoggedIn: boolean,
  base = "http://localhost:3000"
) {
  return {
    nextUrl: new URL(pathname, base),
    url: `${base}${pathname}`,
    auth: isLoggedIn ? { user: { id: "u1" } } : null,
  };
}

function isPassThrough(res: Response) {
  return res.headers.get("x-middleware-next") === "1";
}

function redirectLocation(res: Response) {
  return res.headers.get("location");
}

describe("middleware auth routing", () => {
  let middleware: (req: ReturnType<typeof mockReq>) => Response;

  beforeAll(async () => {
    const mod = await import("@/middleware");
    middleware = mod.default as (req: ReturnType<typeof mockReq>) => Response;
    expect(handlers.length).toBeGreaterThan(0);
  });

  it("passes through /api/auth/* routes", () => {
    const res = middleware(mockReq("/api/auth/signin", false));
    expect(isPassThrough(res)).toBe(true);
  });

  it("passes through /api/register, /api/health, and /api/clip", () => {
    for (const path of ["/api/register", "/api/health", "/api/clip"]) {
      const res = middleware(mockReq(path, false));
      expect(isPassThrough(res)).toBe(true);
    }
  });

  it("passes through /share/* routes", () => {
    const res = middleware(mockReq("/share/abc123", false));
    expect(isPassThrough(res)).toBe(true);
  });

  it("redirects /login to /dashboard when logged in", () => {
    const res = middleware(mockReq("/login", true));
    expect(res.status).toBe(307);
    expect(redirectLocation(res)).toBe("http://localhost:3000/dashboard");
  });

  it("redirects /dashboard to /login when not logged in", () => {
    const res = middleware(mockReq("/dashboard", false));
    expect(res.status).toBe(307);
    expect(redirectLocation(res)).toBe("http://localhost:3000/login");
  });

  it("allows / when not logged in (public route)", () => {
    const res = middleware(mockReq("/", false));
    expect(isPassThrough(res)).toBe(true);
  });

  it("allows /dashboard when logged in", () => {
    const res = middleware(mockReq("/dashboard", true));
    expect(isPassThrough(res)).toBe(true);
  });

  it("returns NextResponse instances", () => {
    const pass = middleware(mockReq("/api/health", false));
    const redirect = middleware(mockReq("/dashboard", false));
    expect(pass).toBeInstanceOf(NextResponse);
    expect(redirect).toBeInstanceOf(NextResponse);
  });
});