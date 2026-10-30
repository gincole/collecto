"use client";

import { ErrorState, PageContainer } from "@/components/shared";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <PageContainer as="main">
      <ErrorState
        description="This page could not be loaded. Try again. Your saved data has not changed."
        onRetry={reset}
        title="Something went wrong"
      />
    </PageContainer>
  );
}
