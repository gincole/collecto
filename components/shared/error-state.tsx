"use client";

import { CircleAlert } from "lucide-react";
import { useId, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const headingElements = {
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

type ErrorStateProps = {
  className?: string;
  description: string;
  headingLevel?: keyof typeof headingElements;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  title: string;
};

function ErrorState({
  className,
  description,
  headingLevel = 2,
  onRetry,
  retryLabel = "Try again",
  title,
}: ErrorStateProps) {
  const titleId = useId();
  const [pending, startTransition] = useTransition();
  const Heading = headingElements[headingLevel];

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "border-error/25 bg-surface rounded-card sm:p-panel flex min-h-64 flex-col items-center justify-center gap-4 border p-5 text-center",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="bg-error/10 text-error rounded-card flex size-12 items-center justify-center [&_svg]:size-6"
      >
        <CircleAlert />
      </div>
      <div className="max-w-md space-y-2">
        <Heading className="text-card-title text-foreground" id={titleId}>
          {title}
        </Heading>
        <p className="text-foreground-muted text-base leading-6">
          {description}
        </p>
      </div>
      {onRetry ? (
        <Button
          aria-busy={pending}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await onRetry();
            })
          }
          type="button"
          variant="outline"
        >
          {pending ? "Retrying…" : retryLabel}
        </Button>
      ) : null}
    </section>
  );
}

export { ErrorState };
export type { ErrorStateProps };
