"use client";

import { ErrorState, PageContainer } from "@/components/shared";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <PageContainer as="main">
      <ErrorState
        description="Your library could not be loaded. Try again."
        onRetry={reset}
        title="Something went wrong"
      />
    </PageContainer>
  );
}
