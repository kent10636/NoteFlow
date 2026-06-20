import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockCompare = vi.fn();
const credentialsConfigs: Array<{ authorize?: (c: unknown) => Promise<unknown> }> =
  [];

vi.mock("next-auth", () => ({
  default: vi.fn((config: unknown) => {
    void config;
    return {
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  }),
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn((config: unknown) => ({ id: "google", ...config })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config: { authorize?: (c: unknown) => Promise<unknown> }) => {
    credentialsConfigs.push(config);
    return { id: "credentials", ...config };
  }),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => mockCompare(...args),
  },
}));

vi.mock("@/lib/google-auth", () => ({
  isGoogleAuthConfigured: vi.fn(() => false),
}));

vi.mock("@/lib/ensure-schema", () => ({
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe("Credentials authorize", () => {
  let authorize: (credentials: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.clearAllMocks();
    credentialsConfigs.length = 0;
    vi.resetModules();
    await import("@/lib/auth");
    authorize = credentialsConfigs[0]!.authorize!;
  });

  it("returns null when email or password is missing", async () => {
    expect(await authorize({ email: "a@b.com" })).toBeNull();
    expect(await authorize({ password: "secret" })).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns null when user does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(
      await authorize({ email: "a@b.com", password: "secret" })
    ).toBeNull();
  });

  it("returns null when user has no password (OAuth-only account)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      password: null,
    });
    expect(
      await authorize({ email: "a@b.com", password: "secret" })
    ).toBeNull();
  });

  it("returns null when password does not match", async () => {
    mockFindUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      password: "hashed",
      name: "Alice",
      image: null,
    });
    mockCompare.mockResolvedValue(false);
    expect(
      await authorize({ email: "a@b.com", password: "wrong" })
    ).toBeNull();
  });

  it("returns user profile when credentials are valid", async () => {
    mockFindUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      password: "hashed",
      name: "Alice",
      image: "https://img",
    });
    mockCompare.mockResolvedValue(true);

    const user = await authorize({
      email: "a@b.com",
      password: "correct",
    });

    expect(user).toEqual({
      id: "u1",
      email: "a@b.com",
      name: "Alice",
      image: "https://img",
    });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: "a@b.com" },
    });
    expect(mockCompare).toHaveBeenCalledWith("correct", "hashed");
  });
});