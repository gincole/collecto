import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "@/components/shared/navigation-link";

export function BackLink<T extends string>({
  href,
  children,
}: {
  href: Route<T>;
  children: string;
}) {
  return (
    <Link
      href={href}
      className="touch-target focus-ring rounded-control inline-flex max-w-full items-center gap-2 text-sm font-semibold"
    >
      <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </Link>
  );
}
