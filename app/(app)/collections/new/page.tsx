import { PageContainer } from "@/components/shared";
import { createCollectionFromWizardAction } from "@/features/collections/actions";
import { CollectionWizard } from "@/features/collections/collection-wizard";

export default function NewCollectionPage() {
  return (
    <PageContainer as="main" width="form">
      <CollectionWizard createAction={createCollectionFromWizardAction} />
    </PageContainer>
  );
}
