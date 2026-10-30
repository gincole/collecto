import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import { PageContainer } from "@/components/shared";
import { getCollectionQuery } from "@/features/collections/queries";
import { CollectionHeader, GalleryError } from "@/features/gallery";
import { listItemsQuery } from "@/features/items/queries";
import { BrowseView } from "@/features/gallery/browse-view";
import { browseHref, resolveBrowseState } from "@/features/gallery/browse";

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const result = await getCollectionQuery(id);

  if (result.status === "not_found" || result.status === "validation_error")
    notFound();

  if (result.status !== "success") {
    return (
      <PageContainer as="main">
        <GalleryError
          title="Could not load Collection"
          description="This Collection could not be loaded. Return to My Library or try again."
        />
      </PageContainer>
    );
  }

  const collection = result.data;
  const browse = resolveBrowseState(await searchParams, collection.fields);
  if (browse.needsRedirect) redirect(browseHref(id, browse) as Route);
  const items = await listItemsQuery(id);

  return (
    <PageContainer as="main" className="space-y-6">
      <CollectionHeader
        collection={collection}
        items={items.status === "success" ? items.data : []}
      />
      {items.status === "success" ? (
        <BrowseView collection={collection} items={items.data} state={browse} />
      ) : (
        <GalleryError
          title="Could not load Items"
          description="Items could not be loaded. Try again without leaving this Collection."
        />
      )}
    </PageContainer>
  );
}
