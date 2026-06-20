import { describe, it, expect } from "vitest";
import { authConfig } from "@/lib/auth.config";

describe("authConfig callbacks", () => {
  it("copies user id into JWT token", async () => {
    const token = await authConfig.callbacks!.jwt!({
      token: { sub: "sub-1" },
      user: { id: "user-42" },
    } as never);

    expect(token.id).toBe("user-42");
  });

  it("preserves token when no user is present", async () => {
    const token = await authConfig.callbacks!.jwt!({
      token: { id: "existing" },
      user: undefined,
    } as never);

    expect(token.id).toBe("existing");
  });

  it("maps token id onto session user", async () => {
    const session = await authConfig.callbacks!.session!({
      session: { user: { email: "a@b.com" } },
      token: { id: "user-42" },
    } as never);

    expect(session.user.id).toBe("user-42");
  });

  it("leaves session unchanged when token has no id", async () => {
    const session = await authConfig.callbacks!.session!({
      session: { user: { email: "a@b.com" } },
      token: {},
    } as never);

    expect(session.user.id).toBeUndefined();
  });
});