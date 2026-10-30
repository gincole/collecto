import { notFound } from "next/navigation";

import { PageContainer } from "@/components/shared";
import { FlowModal } from "@/components/shared/flow-modal";
import { PageLoadError } from "@/components/shared/page-load-error";
import {
  deleteCollectionFromSettingsAction,
  updateCollectionFromSettingsAction,
} from "@/features/collections/actions";
import { CollectionSettings } from "@/features/collections/collection-settings";
import { getCollectionQuery } from "@/features/collections/queries";
import {
  createFieldAction,
  createOptionAction,
  deleteFieldAction,
  deleteOptionAction,
  getFieldDeleteImpactAction,
  getOptionDeleteImpactAction,
  reorderFieldsAction,
  reorderOptionsAction,
  updateFieldAction,
  updateOptionAction,
} from "@/features/fields/actions";
import {
  FieldManager,
  type FieldManagerActions,
} from "@/features/fields/field-manager";

const fieldActions = {
  createField: createFieldAction,
  createOption: createOptionAction,
  deleteField: deleteFieldAction,
  deleteOption: deleteOptionAction,
  getFieldImpact: getFieldDeleteImpactAction,
  getOptionImpact: getOptionDeleteImpactAction,
  reorderFields: reorderFieldsAction,
  reorderOptions: reorderOptionsAction,
  updateField: updateFieldAction,
  updateOption: updateOptionAction,
} satisfies FieldManagerActions;

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
        <PageLoadError title="Could not load Collection settings" />
      </PageContainer>
    );
  }

  const updateAction = updateCollectionFromSettingsAction.bind(null, id);
  const deleteAction = deleteCollectionFromSettingsAction.bind(null, id);

  return (
    <FlowModal page title="Collection settings" returnTo={`/collections/${id}`}>
      <header className="space-y-2">
        <p className="text-foreground-muted text-sm font-semibold">Settings</p>
        <h1 className="text-page-title-mobile sm:text-page-title break-words">
          {result.data.name}
        </h1>
      </header>
      <CollectionSettings
        collection={result.data}
        deleteAction={deleteAction}
        updateAction={updateAction}
      >
        <FieldManager
          actions={fieldActions}
          collectionId={id}
          fields={result.data.fields}
        />
      </CollectionSettings>
    </FlowModal>
  );
}
