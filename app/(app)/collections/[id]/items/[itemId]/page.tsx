import { notFound } from "next/navigation";

import { PageContainer } from "@/components/shared";
import { BackLink } from "@/components/shared/back-link";
import { PageLoadError } from "@/components/shared/page-load-error";
import { getCollectionQuery } from "@/features/collections/queries";
import { deleteItemFromDetailsAction } from "@/features/items/actions";
import { ItemDetails } from "@/features/items/item-details";
import { getItemQuery } from "@/features/items/queries";

export default async function ItemDetailsPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const [collection, item] = await Promise.all([
    getCollectionQuery(id),
    getItemQuery(id, itemId),
  ]);
  if (
    [collection.status, item.status].some(
      (status) => status === "not_found" || status === "validation_error",
    )
  )
    notFound();
  if (collection.status !== "success" || item.status !== "success")
    return (
      <PageContainer as="main">
        <PageLoadError title="Could not load this Item" />
      </PageContainer>
    );
  return (
    <PageContainer as="main" width="form">
      <header className="pb-6">
        <BackLink href={`/collections/${id}`}>Back to Collection</BackLink>
      </header>
      <ItemDetails
        collectionId={id}
        deleteAction={deleteItemFromDetailsAction}
        fields={collection.data.fields}
        item={item.data}
      />
    </PageContainer>
  );
}
