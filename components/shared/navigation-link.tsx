"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { createPortal } from "react-dom";
import { rememberNavigationOpener } from "./navigation-focus";

function NavigationProgress() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return createPortal(
    <span
      className="pointer-events-none fixed inset-x-0 top-0 z-[80]"
      role="status"
    >
      <span
        aria-hidden="true"
        className="bg-selection-border block h-1 w-full motion-safe:animate-pulse"
      />
      <span className="sr-only">Loading page</span>
    </span>,
    document.body,
  );
}

export default function NavigationLink<T extends string>({
  children,
  onClick,
  ...props
}: ComponentProps<typeof Link<T>>) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        rememberNavigationOpener(event.currentTarget);
        onClick?.(event);
      }}
    >
      {children}
      <NavigationProgress />
    </Link>
  );
}
