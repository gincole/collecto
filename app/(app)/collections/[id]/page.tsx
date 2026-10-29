import { PackageOpen } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState, PageContainer, PresetArtwork } from "@/components/shared";
import { getCollectionQuery } from "@/features/collections/queries";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCollectionQuery(id);

  if (result.status === "not_found" || result.status === "validation_error")
    notFound();

  if (result.status !== "success") {
    return (
      <PageContainer as="main">
        <p className="text-error" role="alert">
          Could not load this collection. Return to My Library and try again.
        </p>
      </PageContainer>
    );
  }

  const collection = result.data;

  return (
    <PageContainer as="main">
      <header className="flex items-center gap-4 py-3 sm:gap-6 sm:py-6">
        <PresetArtwork presetKey={collection.presetKey ?? "blank"} size="lg" />
        <div className="min-w-0 space-y-1">
          <h1 className="text-page-title-mobile sm:text-page-title break-words">
            {collection.name}
          </h1>
          {collection.description ? (
            <p className="text-foreground-muted break-words">
              {collection.description}
            </p>
          ) : null}
          <p className="text-foreground-muted text-sm">
            {collection.itemCount}{" "}
            {collection.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
      </header>
      {collection.itemCount === 0 ? (
        <EmptyState
          className="mt-6"
          description="This collection is ready for the things you want to remember."
          icon={<PackageOpen aria-hidden="true" />}
          title="No items yet"
        />
      ) : null}
    </PageContainer>
  );
}
