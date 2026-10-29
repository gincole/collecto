"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

export type AuthActionState = {
  fieldErrors?: Partial<
    Record<"confirmPassword" | "email" | "password", string>
  >;
  message?: string;
  status: "confirmation" | "error" | "idle";
};

export type AuthFormAction = (
  previousState: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

const initialState: AuthActionState = { status: "idle" };

type AuthFormProps = {
  action: AuthFormAction;
  mode: "login" | "register";
  returnTo?: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="text-error text-sm" id={id}>
      {message}
    </p>
  ) : null;
}

export function AuthForm({ action, mode, returnTo }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const registering = mode === "register";
  const alternatePath = registering ? "/login" : "/register";
  const alternateHref = {
    pathname: alternatePath,
    query: returnTo ? { returnTo } : undefined,
  };

  return (
    <form action={formAction} className="space-y-5">
      {returnTo ? (
        <input name="returnTo" type="hidden" value={returnTo} />
      ) : null}
      <div className="space-y-2">
        <label className="text-label block" htmlFor={`${mode}-email`}>
          Email
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.email ? `${mode}-email-error` : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          className="border-control-border bg-surface focus-ring rounded-control h-12 w-full border px-3 text-base"
          id={`${mode}-email`}
          inputMode="email"
          name="email"
          required
          type="email"
        />
        <FieldError
          id={`${mode}-email-error`}
          message={state.fieldErrors?.email}
        />
      </div>

      <div className="space-y-2">
        <label className="text-label block" htmlFor={`${mode}-password`}>
          Password
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.password ? `${mode}-password-error` : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete={registering ? "new-password" : "current-password"}
          className="border-control-border bg-surface focus-ring rounded-control h-12 w-full border px-3 text-base"
          id={`${mode}-password`}
          minLength={8}
          name="password"
          required
          type="password"
        />
        <FieldError
          id={`${mode}-password-error`}
          message={state.fieldErrors?.password}
        />
      </div>

      {registering ? (
        <div className="space-y-2">
          <label
            className="text-label block"
            htmlFor="register-confirm-password"
          >
            Confirm password
          </label>
          <input
            aria-describedby={
              state.fieldErrors?.confirmPassword
                ? "register-confirm-password-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            autoComplete="new-password"
            className="border-control-border bg-surface focus-ring rounded-control h-12 w-full border px-3 text-base"
            id="register-confirm-password"
            minLength={8}
            name="confirmPassword"
            required
            type="password"
          />
          <FieldError
            id="register-confirm-password-error"
            message={state.fieldErrors?.confirmPassword}
          />
        </div>
      ) : null}

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-error text-sm"
              : "text-success text-sm"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending
          ? registering
            ? "Creating account…"
            : "Logging in…"
          : registering
            ? "Create account"
            : "Log in"}
      </Button>

      <p className="text-foreground-muted text-center text-sm">
        {registering ? "Already have an account? " : "New to little things? "}
        <Link
          className="text-foreground font-semibold underline-offset-4 hover:underline"
          href={alternateHref}
        >
          {registering ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
