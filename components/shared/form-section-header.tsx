import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function FormSectionHeader({
  title,
  description,
  action,
  id,
  as: Heading = "h2",
  primary = false,
  titleClassName,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  id?: string;
  as?: "h1" | "h2" | "h3" | "h4";
  primary?: boolean;
  titleClassName?: string;
  className?: string;
}) {
  return (
    <div
      data-section-header
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <Heading
          id={id}
          data-form-heading={primary ? "primary" : "section"}
          className={cn(
            "text-section-title-mobile sm:text-section-title",
            titleClassName,
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p data-section-description className="text-foreground-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div data-section-action className="shrink-0">
          {action}
        </div>
      ) : null}
    </div>
  );
}
