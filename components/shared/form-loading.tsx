import { PageContainer } from "./page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function FormLoading({
  label = "Loading form",
  image = false,
}: {
  label?: string;
  image?: boolean;
}) {
  return (
    <PageContainer as="main" width="form">
      <div
        aria-label={label}
        aria-busy="true"
        role="status"
        className="space-y-6"
      >
        <div className="space-y-3 py-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-2/3" />
        </div>
        <div
          className={
            image
              ? "grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
              : "space-y-6"
          }
        >
          {image ? <Skeleton className="aspect-[4/3] w-full" /> : null}
          <div className="space-y-6">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="ml-auto h-11 w-36" />
      </div>
    </PageContainer>
  );
}
