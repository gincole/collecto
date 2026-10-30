import { notFound } from "next/navigation";
import { PageContainer } from "@/components/shared";
import { getCollectionQuery } from "@/features/collections/queries";
import { createItemFromFormAction } from "@/features/items/actions";
import { ItemForm } from "@/features/items/item-form";
import { FlowModal } from "@/components/shared/flow-modal";
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
    <FlowModal page title="Add item" returnTo={`/collections/${id}`}>
      <header className="space-y-2 pb-6">
        <p className="text-foreground-muted text-sm">{result.data.name}</p>
      </header>
      <ItemForm
        action={createItemFromFormAction}
        collectionId={id}
        fields={result.data.fields}
        mode="create"
        modal
      />
    </FlowModal>
  );
}
