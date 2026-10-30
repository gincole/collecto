import { PageContainer } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
export default function LibraryLoading() {
  return (
    <PageContainer as="main">
      <div aria-busy="true" aria-label="Loading collections" role="status">
        <div className="space-y-3 py-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-64 max-w-full sm:h-16" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="sm:pt-section grid grid-cols-1 gap-4 pt-8 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton
              aria-hidden="true"
              className="rounded-card h-56"
              key={index}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
