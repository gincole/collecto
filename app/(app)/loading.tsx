import { LoadingSkeleton, PageContainer } from "@/components/shared";

export default function AppLoading() {
  return (
    <PageContainer as="main">
      <LoadingSkeleton
        className="max-w-xl py-8"
        label="Loading your library"
        lines={4}
      />
    </PageContainer>
  );
}
