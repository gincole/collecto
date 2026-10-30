"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "@/components/shared/navigation-link";
import { useActionState, useEffect } from "react";
import { useFeedback } from "./feedback";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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
    <header className="bg-surface sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
      <div className="max-w-page page-insets mx-auto flex h-16 items-center justify-between gap-4">
        <Link className="text-card-title font-semibold" href="/library">
          collecto
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Account menu"
              >
                <UserRound aria-hidden="true" className="size-5" />
                <span className="sr-only">Account menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[min(18rem,calc(100vw-2rem))] p-3">
              <DropdownMenuLabel className="text-foreground-muted block truncate px-2 py-2 text-sm">
                {email}
              </DropdownMenuLabel>
              <form noValidate action={formAction}>
                {logoutState.status === "error" ? (
                  <p className="text-error px-2 pb-2 text-sm" role="alert">
                    {logoutState.message}
                  </p>
                ) : null}
                <DropdownMenuItem
                  onSelect={(event) => event.preventDefault()}
                  asChild
                >
                  <Button
                    className="w-full justify-start"
                    disabled={pending}
                    type="submit"
                    variant="ghost"
                  >
                    <LogOut aria-hidden="true" />
                    {pending ? "Logging out…" : "Log out"}
                  </Button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
