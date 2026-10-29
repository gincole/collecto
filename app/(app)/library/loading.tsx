import { PageContainer } from "@/components/shared";

export default function LibraryLoading() {
  return (
    <PageContainer as="main">
      <div aria-busy="true" aria-label="Loading collections" role="status">
        <div className="space-y-3 py-4">
          <div
            aria-hidden="true"
            className="bg-surface-muted h-4 w-40 animate-pulse rounded"
          />
          <div
            aria-hidden="true"
            className="bg-surface-muted h-10 w-64 max-w-full animate-pulse rounded"
          />
          <div
            aria-hidden="true"
            className="bg-surface-muted h-5 w-96 max-w-full animate-pulse rounded"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 pt-8 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              aria-hidden="true"
              className="border-border bg-surface rounded-card h-56 animate-pulse border"
              key={index}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
