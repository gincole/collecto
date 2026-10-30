import { notFound } from "next/navigation";

import { PageContainer } from "@/components/shared";
import { getCollectionQuery } from "@/features/collections/queries";
import {
  CollectionGallery,
  CollectionHeader,
  GalleryError,
} from "@/features/gallery";
import { listItemsQuery } from "@/features/items/queries";

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
        <GalleryError
          title="Could not load Collection"
          description="This Collection could not be loaded. Return to My Library or try again."
        />
      </PageContainer>
    );
  }

  const collection = result.data;
  const items = await listItemsQuery(id);

  return (
    <PageContainer as="main" className="space-y-6">
      <CollectionHeader collection={collection} />
      {items.status === "success" ? (
        <CollectionGallery collection={collection} items={items.data} />
      ) : (
        <GalleryError
          title="Could not load Items"
          description="Items could not be loaded. Try again without leaving this Collection."
        />
      )}
    </PageContainer>
  );
}
