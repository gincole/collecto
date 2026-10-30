import type { Route } from "next";
import type { MouseEventHandler, ReactNode } from "react";
import Link from "./navigation-link";
import { DisplayName } from "./display-name";
import { cardHoverMotion } from "@/lib/design/card-motion";
import { cn } from "@/lib/utils/cn";

export function NavigationCard<T extends string>({
  name,
  count,
  artwork,
  href,
  label,
  heading = "h2",
  actions,
  onClick,
}: {
  name: string;
  count: number;
  artwork: ReactNode;
  href: Route<T>;
  label: string;
  heading?: "h2" | "h3";
  actions?: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <article
      className={cn(
        "border-border bg-surface rounded-card relative h-full min-w-0 border",
        cardHoverMotion,
      )}
    >
      <Link
        aria-label={label}
        className="focus-ring rounded-card block h-full"
        href={href}
        onClick={onClick}
      >
        <div className="bg-surface-muted text-foreground rounded-t-card flex h-28 w-full items-center justify-center overflow-hidden sm:h-36">
          {artwork}
        </div>
        <div className="min-w-0 space-y-1 p-3">
          <DisplayName
            as={heading}
            className="text-card-title-mobile sm:text-card-title font-semibold"
          >
            {name}
          </DisplayName>
          <p className="text-foreground-muted text-sm">
            {count} {count === 1 ? "item" : "items"}
          </p>
        </div>
      </Link>
      {actions ? (
        <div className="bg-surface rounded-control absolute top-2 right-2">
          {actions}
        </div>
      ) : null}
    </article>
  );
}
