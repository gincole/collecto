import { PageContainer } from "@/components/shared";
import { LibraryContent } from "@/features/collections/library-content";
import { listCollectionsQuery } from "@/features/collections/queries";
export default async function LibraryPage() {
  const result = await listCollectionsQuery();
  return (
    <PageContainer as="main">
      <LibraryContent
        collections={result.status === "success" ? result.data : null}
      />
    </PageContainer>
  );
}
