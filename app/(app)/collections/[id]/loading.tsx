import { PageContainer } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionLoading() {
  return (
    <PageContainer as="main">
      <div
        aria-busy="true"
        aria-label="Loading collection gallery"
        className="space-y-8"
        role="status"
      >
        <div className="flex items-center gap-4 py-4">
          <Skeleton className="size-20 shrink-0" />
          <div className="w-full max-w-md space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div data-testid="gallery-card-skeleton" key={index}>
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="mt-3 h-5 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
