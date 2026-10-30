import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock, createServerClientMock, cookiesMock } =
  vi.hoisted(() => ({
    cookiesMock: vi.fn(),
    createBrowserClientMock: vi.fn(),
    createServerClientMock: vi.fn(),
  }));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
  createServerClient: createServerClientMock,
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));

vi.mock("@/lib/env/client", () => ({
  clientEnv: {
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55321",
  },
}));

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55321",
  },
}));

import {
  createLoginUrl,
  getSafeReturnPath,
  isProtectedPath,
} from "@/features/auth";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { updateSession } from "@/lib/supabase/proxy";
import {
  createClient as createServerClient,
  createClientWithCookieStore,
} from "@/lib/supabase/server";

describe("authentication redirects", () => {
  it.each(["/library", "/collections/new", "/collections/019d/items/new"])(
    "treats %s as protected",
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(true);
    },
  );

  it.each(["/", "/login", "/register", "/favicon.ico"])(
    "keeps %s public",
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(false);
    },
  );

  it("preserves an internal path, query, and encoded values", () => {
    expect(getSafeReturnPath("/collections/abc?groupByFieldId=one%20two")).toBe(
      "/collections/abc?groupByFieldId=one%20two",
    );
  });

  it.each([
    "https://attacker.example/steal",
    "//attacker.example/steal",
    "/\\attacker.example/steal",
    "javascript:alert(1)",
    "/login?returnTo=/collections/abc",
  ])("rejects unsafe or recursive return URL %s", (returnTo) => {
    expect(getSafeReturnPath(returnTo)).toBe("/library");
  });

  it("builds a login URL with the intended protected location", () => {
    const requestUrl = new URL(
      "https://collecto.example/collections/abc?view=compact",
    );

    expect(createLoginUrl(requestUrl).toString()).toBe(
      "https://collecto.example/login?returnTo=%2Fcollections%2Fabc%3Fview%3Dcompact",
    );
  });
});

describe("Supabase client factories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a browser client with public configuration only", () => {
    const marker = { kind: "browser" };
    createBrowserClientMock.mockReturnValue(marker);

    expect(createBrowserClient()).toBe(marker);
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "http://127.0.0.1:55321",
      "publishable-key",
    );
  });

  it("connects server auth storage to the provided cookie store", () => {
    const cookieStore = {
      getAll: vi.fn(() => [{ name: "session", value: "old" }]),
      set: vi.fn(),
    };
    createServerClientMock.mockReturnValue({ kind: "server" });

    createClientWithCookieStore(cookieStore);

    const options = createServerClientMock.mock.calls[0]?.[2];
    expect(options.cookies.getAll()).toEqual([
      { name: "session", value: "old" },
    ]);
    options.cookies.setAll([
      { name: "session", value: "new", options: { httpOnly: true } },
    ]);
    expect(cookieStore.set).toHaveBeenCalledWith("session", "new", {
      httpOnly: true,
    });
  });

  it("uses the Next.js server cookie store", async () => {
    const cookieStore = { getAll: vi.fn(() => []), set: vi.fn() };
    cookiesMock.mockResolvedValue(cookieStore);
    createServerClientMock.mockReturnValue({ kind: "server" });

    await expect(createServerClient()).resolves.toEqual({ kind: "server" });
    expect(cookiesMock).toHaveBeenCalledOnce();
  });
});

describe("session refresh proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects a signed-out protected request and preserves refreshed cookies", async () => {
    createServerClientMock.mockImplementation((_url, _key, options) => ({
      auth: {
        getClaims: async () => {
          options.cookies.setAll([
            {
              name: "sb-session",
              value: "refreshed",
              options: { httpOnly: true, path: "/" },
            },
          ]);
          return { data: null, error: null };
        },
      },
    }));
    const request = new NextRequest(
      "https://collecto.example/collections/abc?view=compact",
    );

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://collecto.example/login?returnTo=%2Fcollections%2Fabc%3Fview%3Dcompact",
    );
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
  });

  it("allows an authenticated protected request", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "user-id" } },
          error: null,
        }),
      },
    });
    const request = new NextRequest("https://collecto.example/library");

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
