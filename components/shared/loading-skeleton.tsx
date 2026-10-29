import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type LoadingSkeletonProps = {
  className?: string;
  label?: string;
  lines?: number;
};

function LoadingSkeleton({
  className,
  label = "Loading",
  lines = 3,
}: LoadingSkeletonProps) {
  const lineCount = Math.max(1, Math.floor(lines));

  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={cn("space-y-3", className)}
      role="status"
    >
      {Array.from({ length: lineCount }, (_, index) => (
        <Skeleton
          aria-hidden="true"
          className={cn("h-5", index === lineCount - 1 && "w-2/3")}
          key={index}
        />
      ))}
    </div>
  );
}

export { LoadingSkeleton };
export type { LoadingSkeletonProps };
