import { notFound } from "next/navigation";
import { PageContainer } from "@/components/shared";
import { getCollectionQuery } from "@/features/collections/queries";
import { createItemFromFormAction } from "@/features/items/actions";
import { ItemForm } from "@/features/items/item-form";
export default async function NewItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCollectionQuery(id);
  if (result.status === "not_found" || result.status === "validation_error")
    notFound();
  if (result.status !== "success")
    return (
      <PageContainer as="main">
        <p className="text-error" role="alert">
          Could not load this Collection. Try again.
        </p>
      </PageContainer>
    );
  return (
    <PageContainer as="main">
      <header className="py-4 sm:py-8">
        <p className="text-foreground-muted text-sm">{result.data.name}</p>
        <h1 className="text-page-title-mobile sm:text-page-title">
          Add new item
        </h1>
      </header>
      <ItemForm
        action={createItemFromFormAction}
        collectionId={id}
        fields={result.data.fields}
        mode="create"
      />
    </PageContainer>
  );
}
