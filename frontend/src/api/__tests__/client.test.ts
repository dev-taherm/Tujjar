import { describe, it, expect } from "vitest";
import { setTokens, clearTokens, loadTokens } from "../client";

describe("Token management", () => {
  it("should set and load tokens", () => {
    setTokens("access123", "refresh123");
    const tokens = loadTokens();
    expect(tokens.accessToken).toBe("access123");
    expect(tokens.refreshToken).toBe("refresh123");
  });

  it("should clear tokens", () => {
    setTokens("access123", "refresh123");
    clearTokens();
    const tokens = loadTokens();
    expect(tokens.accessToken).toBeNull();
    expect(tokens.refreshToken).toBeNull();
  });
});
