import { describe, expect, it } from "vitest";

import { parsePublicEnv } from "@/lib/env/public";

describe("parsePublicEnv", () => {
  it("accepts valid public Supabase configuration", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });
  });

  it("reports variable names without exposing supplied values", () => {
    const secretValue = "not-a-valid-url-secret-value";

    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        NEXT_PUBLIC_SUPABASE_URL: secretValue,
      }),
    ).toThrowError(
      "Invalid environment configuration: NEXT_PUBLIC_SUPABASE_URL",
    );

    try {
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        NEXT_PUBLIC_SUPABASE_URL: secretValue,
      });
    } catch (error) {
      expect(String(error)).not.toContain(secretValue);
    }
  });
});
