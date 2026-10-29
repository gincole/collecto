import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-surface-muted animate-pulse rounded-xl motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
