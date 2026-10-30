import { LoadingSkeleton, PageContainer } from "@/components/shared";

export default function RootLoading() {
  return (
    <PageContainer as="main">
      <LoadingSkeleton label="Loading page" lines={6} />
    </PageContainer>
  );
}
