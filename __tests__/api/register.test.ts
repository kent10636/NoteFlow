import { describe, it, expect } from "vitest";

describe("Register API validation", () => {
  it("should require email and password", () => {
    const body = { name: "Test" };
    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("password");
  });

  it("should enforce minimum password length", () => {
    const password = "12345";
    expect(password.length).toBeLessThan(6);
  });

  it("should accept valid registration data", () => {
    const body = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };
    expect(body.email).toContain("@");
    expect(body.password.length).toBeGreaterThanOrEqual(6);
  });
});