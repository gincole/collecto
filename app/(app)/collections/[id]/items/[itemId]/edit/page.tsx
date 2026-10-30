import { notFound } from "next/navigation";
import { PageContainer } from "@/components/shared";
import { getCollectionQuery } from "@/features/collections/queries";
import { updateItemFromFormAction } from "@/features/items/actions";
import { ItemForm } from "@/features/items/item-form";
import { getItemQuery } from "@/features/items/queries";
import { BackLink } from "@/components/shared/back-link";
import { PageLoadError } from "@/components/shared/page-load-error";
export default async function EditItemPage({
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
      <header className="space-y-2 pb-6">
        <BackLink href={`/collections/${id}/items/${itemId}`}>
          Back to Item
        </BackLink>
        <p className="text-foreground-muted text-sm">{collection.data.name}</p>
        <h1 className="text-page-title-mobile sm:text-page-title">Edit item</h1>
      </header>
      <ItemForm
        action={updateItemFromFormAction}
        collectionId={id}
        fields={collection.data.fields}
        item={item.data}
        mode="edit"
      />
    </PageContainer>
  );
}
