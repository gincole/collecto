import { FlowModal } from "@/components/shared/flow-modal";
import { createCollectionFromWizardAction } from "@/features/collections/actions";
import { CollectionWizard } from "@/features/collections/collection-wizard";

export default function NewCollectionPage() {
  return (
    <FlowModal page title="New collection" returnTo="/library">
      <CollectionWizard createAction={createCollectionFromWizardAction} />
    </FlowModal>
  );
}
