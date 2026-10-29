import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/env/server", () => ({
  serverEnv: { NEXT_PUBLIC_SITE_URL: "https://little-things.example" },
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import {
  loginAction,
  logoutAction,
  registerAction,
} from "@/features/auth/actions";

const initialState = { status: "idle" as const };

describe("authentication server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns field errors before calling the authentication provider", async () => {
    const formData = new FormData();
    formData.set("email", "invalid");
    formData.set("password", "short");

    const result = await loginAction(initialState, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toMatchObject({
      email: "Enter a valid email address.",
      password: "Password must be at least 8 characters.",
    });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("logs in and redirects only to the validated internal return path", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({ auth: { signInWithPassword } });
    const formData = new FormData();
    formData.set("email", "person@example.com");
    formData.set("password", "Example-pass-42!");
    formData.set("returnTo", "https://attacker.example/steal");

    await expect(loginAction(initialState, formData)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirectMock).toHaveBeenCalledWith("/library");
  });

  it("returns confirmation instead of promising a session when signup needs email confirmation", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });
    createClientMock.mockResolvedValue({
      auth: { signUp },
    });
    const formData = new FormData();
    formData.set("confirmPassword", "Example-pass-42!");
    formData.set("email", "person@example.com");
    formData.set("password", "Example-pass-42!");

    await expect(registerAction(initialState, formData)).resolves.toEqual({
      message: "Check your email to continue setting up your account.",
      status: "confirmation",
    });
    expect(signUp).toHaveBeenCalledWith({
      email: "person@example.com",
      options: {
        emailRedirectTo:
          "https://little-things.example/auth/callback?next=%2Flibrary",
      },
      password: "Example-pass-42!",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("logs out the current session and redirects to login", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({ auth: { signOut } });

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("returns a safe inline error when logout fails", async () => {
    createClientMock.mockResolvedValue({
      auth: { signOut: vi.fn().mockRejectedValue(new Error("provider down")) },
    });

    await expect(logoutAction()).resolves.toEqual({
      message: "We could not log you out. Try again.",
      status: "error",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
