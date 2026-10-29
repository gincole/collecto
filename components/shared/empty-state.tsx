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
        "border-border bg-surface flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-6 text-center sm:p-8",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="bg-surface-muted text-foreground-muted flex size-12 items-center justify-center rounded-2xl [&_svg]:size-6"
      >
        {icon}
      </div>
      <div className="max-w-md space-y-2">
        <Heading className="text-foreground text-xl font-semibold" id={titleId}>
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
