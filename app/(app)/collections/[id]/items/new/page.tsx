import { notFound } from "next/navigation";
import { PageContainer } from "@/components/shared";
import { getCollectionQuery } from "@/features/collections/queries";
import { createItemFromFormAction } from "@/features/items/actions";
import { ItemForm } from "@/features/items/item-form";
import { BackLink } from "@/components/shared/back-link";
import { PageLoadError } from "@/components/shared/page-load-error";
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
        <PageLoadError title="Could not load this Collection" />
      </PageContainer>
    );
  return (
    <PageContainer as="main" width="form">
      <header className="space-y-2 pb-6">
        <BackLink href={`/collections/${id}`}>Back to Collection</BackLink>
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
