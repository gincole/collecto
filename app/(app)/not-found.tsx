import { EmptyState, PageContainer } from "@/components/shared";
import { BackLink } from "@/components/shared/back-link";
export default function NotFound() {
  return (
    <PageContainer as="main">
      <EmptyState
        title="This page is unavailable"
        description="It may have been removed, or you may not have access."
        action={<BackLink href="/library">Back to My Library</BackLink>}
      />
    </PageContainer>
  );
}
