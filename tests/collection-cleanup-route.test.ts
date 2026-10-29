import { describe, expect, it } from "vitest";

import { authorizeCleanupRequest } from "@/features/collections/cleanup-auth";

describe("storage cleanup admin authorization", () => {
  it("accepts only the exact configured bearer secret", () => {
    expect(
      authorizeCleanupRequest("Bearer strong-secret", "strong-secret"),
    ).toBe(true);
    expect(
      authorizeCleanupRequest("Bearer wrong-secret", "strong-secret"),
    ).toBe(false);
    expect(authorizeCleanupRequest(null, "strong-secret")).toBe(false);
  });

  it("stays disabled when no server secret is configured", () => {
    expect(authorizeCleanupRequest("Bearer anything", undefined)).toBe(false);
    expect(authorizeCleanupRequest("Bearer ", "")).toBe(false);
  });
});
