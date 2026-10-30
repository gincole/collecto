import { PackageOpen } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const headingElements = {
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  headingLevel?: keyof typeof headingElements;
  icon?: ReactNode;
  title: string;
};

function EmptyState({
  action,
  className,
  description,
  headingLevel = 2,
  icon = <PackageOpen aria-hidden="true" />,
  title,
}: EmptyStateProps) {
  const titleId = useId();
  const Heading = headingElements[headingLevel];

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "border-border bg-surface rounded-card sm:p-panel flex min-h-64 flex-col items-center justify-center gap-4 border border-dashed p-5 text-center",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="bg-surface-muted text-foreground-muted rounded-card flex size-12 items-center justify-center [&_svg]:size-6"
      >
        {icon}
      </div>
      <div className="max-w-md space-y-2">
        <Heading className="text-card-title text-foreground" id={titleId}>
          {title}
        </Heading>
        <p className="text-foreground-muted text-base leading-6">
          {description}
        </p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  );
}

export { EmptyState };
export type { EmptyStateProps };
