import { PageContainer } from "@/components/shared/page-container";
import { BackLink } from "@/components/shared/back-link";

export default function NotFound() {
  return (
    <PageContainer as="main" className="space-y-4">
      <h1 className="text-page-title-mobile sm:text-page-title">
        This page is unavailable
      </h1>
      <p className="text-foreground-muted">
        It may have been removed, or the address may be incorrect.
      </p>
      <BackLink href="/library">Back to My Library</BackLink>
    </PageContainer>
  );
}
