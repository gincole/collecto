import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/shared";
import { Button } from "@/components/ui/button";
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
        <p className="text-error" role="alert">
          Could not load this Item. Try again.
        </p>
      </PageContainer>
    );
  return (
    <PageContainer as="main">
      <header className="flex items-center gap-3 py-4 sm:py-8">
        <Button asChild size="sm" variant="ghost">
          <Link href={`/collections/${id}`}>
            Back to {collection.data.name}
          </Link>
        </Button>
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
