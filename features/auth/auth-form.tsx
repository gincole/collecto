"use client";

import { Input } from "@/components/ui/form-control";
import Link from "@/components/shared/navigation-link";
import { useActionState, useEffect, useRef } from "react";
import { useFeedback } from "@/components/shared/feedback";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/shared/feedback-message";

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
  const notify = useFeedback();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef("");
  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "error") {
      notify(
        state.message ?? "Review the highlighted fields and try again.",
        "error",
      );
      const email = formRef.current?.elements.namedItem("email");
      if (email instanceof HTMLInputElement) email.value = emailRef.current;
      const first = Object.keys(state.fieldErrors ?? {})[0];
      const control = first ? formRef.current?.elements.namedItem(first) : null;
      if (control instanceof HTMLElement) control.focus();
    } else notify("Check your email to continue.", "info");
  }, [state, notify]);
  const registering = mode === "register";
  const alternatePath = registering ? "/login" : "/register";
  const alternateHref = {
    pathname: alternatePath,
    query: returnTo ? { returnTo } : undefined,
  };

  return (
    <form
      noValidate
      ref={formRef}
      onSubmitCapture={(event) => {
        const email = new FormData(event.currentTarget).get("email");
        emailRef.current = typeof email === "string" ? email : "";
      }}
      action={formAction}
      className="space-y-5"
    >
      {returnTo ? (
        <Input name="returnTo" type="hidden" value={returnTo} />
      ) : null}
      <div className="space-y-2">
        <label className="text-label block" htmlFor={`${mode}-email`}>
          Email
        </label>
        <Input
          aria-describedby={
            state.fieldErrors?.email ? `${mode}-email-error` : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          className="h-11"
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
        <Input
          aria-describedby={
            state.fieldErrors?.password ? `${mode}-password-error` : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete={registering ? "new-password" : "current-password"}
          className="h-11"
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
          <Input
            aria-describedby={
              state.fieldErrors?.confirmPassword
                ? "register-confirm-password-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            autoComplete="new-password"
            className="h-11"
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
        <FeedbackMessage kind={state.status === "error" ? "error" : "success"}>
          {state.message}
        </FeedbackMessage>
      ) : null}

      {state.status === "error" && !state.message ? (
        <FeedbackMessage kind="error">
          Review the highlighted fields and try again.
        </FeedbackMessage>
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
        {registering ? "Already have an account? " : "New to Collecto? "}
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
