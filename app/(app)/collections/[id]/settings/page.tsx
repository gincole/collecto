import { notFound } from "next/navigation";

import { PageContainer } from "@/components/shared";
import {
  deleteCollectionFromSettingsAction,
  updateCollectionFromSettingsAction,
} from "@/features/collections/actions";
import { CollectionSettings } from "@/features/collections/collection-settings";
import { getCollectionQuery } from "@/features/collections/queries";

export default async function CollectionSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCollectionQuery(id);

  if (result.status === "not_found" || result.status === "validation_error") {
    notFound();
  }

  if (result.status !== "success") {
    return (
      <PageContainer as="main">
        <p className="text-error" role="alert">
          Could not load Collection settings. Return to My Library and try
          again.
        </p>
      </PageContainer>
    );
  }

  const updateAction = updateCollectionFromSettingsAction.bind(null, id);
  const deleteAction = deleteCollectionFromSettingsAction.bind(null, id);

  return (
    <PageContainer as="main" width="default">
      <header className="space-y-1 pt-4 sm:pt-8">
        <p className="text-foreground-muted text-sm font-semibold">Settings</p>
        <h1 className="text-page-title-mobile sm:text-page-title break-words">
          {result.data.name}
        </h1>
      </header>
      <CollectionSettings
        collection={result.data}
        deleteAction={deleteAction}
        updateAction={updateAction}
      />
    </PageContainer>
  );
}
