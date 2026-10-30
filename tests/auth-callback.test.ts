import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { GET } from "@/app/auth/callback/route";

describe("authentication callback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exchanges the confirmation code and redirects to a safe internal path", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({ auth: { exchangeCodeForSession } });
    const request = new NextRequest(
      "https://collecto.example/auth/callback?code=confirmation-code&next=%2Fcollections%2Fabc",
    );

    const response = await GET(request);

    expect(exchangeCodeForSession).toHaveBeenCalledWith("confirmation-code");
    expect(response.headers.get("location")).toBe(
      "https://collecto.example/collections/abc",
    );
  });

  it("returns to login with a generic error when confirmation fails", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: new Error("expired token details"),
        }),
      },
    });
    const request = new NextRequest(
      "https://collecto.example/auth/callback?code=expired",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://collecto.example/login?error=confirmation",
    );
  });

  it("maps a thrown exchange failure to the generic confirmation error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi
          .fn()
          .mockRejectedValue(new Error("private provider details")),
      },
    });
    const request = new NextRequest(
      "https://collecto.example/auth/callback?code=private-token",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://collecto.example/login?error=confirmation",
    );
    expect(log).toHaveBeenCalledWith("Authentication confirmation failed", {
      operation: "auth.exchange-code",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-token");
    log.mockRestore();
  });
});
