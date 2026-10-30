"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "@/components/shared/navigation-link";
import { useActionState, useEffect } from "react";
import { useFeedback } from "./feedback";

import { Button } from "@/components/ui/button";
import type {
  AuthActionState,
  AuthFormAction,
} from "@/features/auth/auth-form";

type AppHeaderProps = {
  email: string;
  logoutAction: AuthFormAction;
};

export function AppHeader({ email, logoutAction }: AppHeaderProps) {
  const notify = useFeedback();
  const [logoutState, formAction, pending] = useActionState(logoutAction, {
    status: "idle",
  } satisfies AuthActionState);
  useEffect(() => {
    if (logoutState.status === "error" && logoutState.message)
      notify(logoutState.message, "error");
  }, [logoutState, notify]);

  return (
    <header className="bg-surface sticky top-0 z-20">
      <div className="max-w-page px-page-mobile sm:px-page-tablet lg:px-page-desktop mx-auto flex h-16 items-center justify-between gap-4">
        <Link className="text-card-title font-semibold" href="/library">
          little things.
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-3">
          <Link
            className="touch-target focus-ring hover:bg-surface-muted rounded-pill inline-flex items-center px-3 text-sm sm:px-4"
            href="/library"
          >
            My Library
          </Link>
          <details className="group relative">
            <summary className="touch-target focus-ring hover:bg-surface-muted rounded-control flex cursor-pointer list-none items-center justify-center [&::-webkit-details-marker]:hidden">
              <UserRound aria-hidden="true" className="size-5" />
              <span className="sr-only">Account menu</span>
            </summary>
            <div className="border-border bg-surface shadow-sheet rounded-card absolute top-full right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] border p-3">
              <p className="text-foreground-muted truncate px-2 py-2 text-sm">
                {email}
              </p>
              <form noValidate action={formAction}>
                {logoutState.status === "error" ? (
                  <p className="text-error px-2 pb-2 text-sm" role="alert">
                    {logoutState.message}
                  </p>
                ) : null}
                <Button
                  className="w-full justify-start"
                  disabled={pending}
                  type="submit"
                  variant="ghost"
                >
                  <LogOut aria-hidden="true" />
                  {pending ? "Logging out…" : "Log out"}
                </Button>
              </form>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
