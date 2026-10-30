import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/shared/app-header";
import { AuthForm } from "@/features/auth/auth-form";
import {
  loginCredentialsSchema,
  registrationCredentialsSchema,
} from "@/features/auth/schemas";
import {
  loginWithPassword,
  logoutCurrentSession,
  registerWithPassword,
} from "@/features/auth/service";

describe("authentication schemas", () => {
  it("normalizes a valid email and accepts a valid password", () => {
    expect(
      loginCredentialsSchema.parse({
        email: "  Person@Example.COM ",
        password: "Example-pass-42!",
      }),
    ).toEqual({ email: "person@example.com", password: "Example-pass-42!" });
  });

  it("rejects invalid credentials and mismatched confirmation", () => {
    expect(
      registrationCredentialsSchema.safeParse({
        confirmPassword: "different1",
        email: "not-an-email",
        password: "short",
      }).success,
    ).toBe(false);
  });
});

describe("authentication service", () => {
  it("returns a generic login error without exposing provider details", async () => {
    const result = await loginWithPassword(
      { email: "person@example.com", password: "Example-pass-42!" },
      {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: new Error("User does not exist"),
        }),
      },
    );

    expect(result).toEqual({
      message: "Email or password is incorrect.",
      status: "error",
    });
  });

  it("maps thrown provider failures to a safe retryable error", async () => {
    await expect(
      loginWithPassword(
        { email: "person@example.com", password: "Example-pass-42!" },
        {
          signInWithPassword: vi
            .fn()
            .mockRejectedValue(new Error("ECONNRESET")),
        },
      ),
    ).resolves.toEqual({
      message: "We could not log you in. Try again.",
      status: "error",
    });
  });

  it("distinguishes immediate registration from email confirmation", async () => {
    const credentials = {
      confirmPassword: "Example-pass-42!",
      email: "person@example.com",
      password: "Example-pass-42!",
    };

    await expect(
      registerWithPassword(credentials, {
        signUp: vi.fn().mockResolvedValue({
          data: { session: { access_token: "token" } },
          error: null,
        }),
      }),
    ).resolves.toEqual({ status: "success" });

    await expect(
      registerWithPassword(credentials, {
        signUp: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      }),
    ).resolves.toEqual({
      message: "Check your email to continue setting up your account.",
      status: "confirmation",
    });
  });

  it("logs out only the current session", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });

    await expect(logoutCurrentSession({ signOut })).resolves.toEqual({
      status: "success",
    });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});

describe("authentication UI", () => {
  it("renders an accessible login form without deferred account features", () => {
    render(
      <AuthForm action={vi.fn()} mode="login" returnTo="/collections/abc" />,
    );

    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/register?returnTo=%2Fcollections%2Fabc");
    expect(screen.queryByText(/forgot password/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
  });

  it("prevents duplicate submissions while the auth action is pending", async () => {
    const user = userEvent.setup();
    const pendingAction = vi.fn(() => new Promise<never>(() => undefined));
    render(<AuthForm action={pendingAction} mode="login" />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "Example-pass-42!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByRole("button", { name: "Logging in…" })).toBeDisabled();
    expect(pendingAction).toHaveBeenCalledOnce();
  });

  it("shows only the email and current-session logout in the account menu", async () => {
    const user = userEvent.setup();
    render(<AppHeader email="person@example.com" logoutAction={vi.fn()} />);

    expect(
      screen.getByRole("link", { name: "little things." }),
    ).toHaveAttribute("href", "/library");
    expect(
      screen.queryByRole("link", { name: "My Library" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("person@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Log out" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/profile|display name|avatar/i),
    ).not.toBeInTheDocument();
  });
});
