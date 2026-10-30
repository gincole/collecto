import { describe, expect, it } from "vitest";
import { assertLocalApiUrl } from "../supabase/tests/local-status.mjs";
import { assertPassingTap } from "../supabase/tests/tap-result.mjs";

describe("disposable integration data safety", () => {
  it("requires a completed TAP plan rather than only a zero process exit", () => {
    expect(() => assertPassingTap("1..2\nok 1 - first\n")).toThrow();
    expect(() =>
      assertPassingTap("1..2\nok 1 - first\nnot ok 2 - failed\n"),
    ).toThrow();
    expect(() =>
      assertPassingTap("1..2\nok 1 - first\nok 1 - repeated\n"),
    ).toThrow();
    expect(() =>
      assertPassingTap(
        "1..1\nok 1 - passed\n# Looks like you planned 2 tests but ran 1\n",
      ),
    ).toThrow();
    expect(() =>
      assertPassingTap("1..2\nok 1 - first\nok 2 - second\n"),
    ).not.toThrow();
  });
  it.each([
    "http://127.0.0.1:54321",
    "http://localhost:54321",
    "http://[::1]:54321",
  ])("accepts local API %s", (url) => expect(assertLocalApiUrl(url)).toBe(url));
  it.each([
    "https://project.supabase.co",
    "http://localhost.evil.test",
    "http://127.0.0.1.evil.test",
    "http://user@host.test",
    "file:///tmp/db",
  ])("rejects nonlocal API %s", (url) =>
    expect(() => assertLocalApiUrl(url)).toThrow(),
  );
});
