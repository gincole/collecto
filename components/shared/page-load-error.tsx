"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "./error-state";
import { BackLink } from "./back-link";

export function PageLoadError({
  title = "Could not load this page",
  description = "Try again. Your saved data has not changed.",
}: {
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <BackLink href="/library">Back to My Library</BackLink>
      <ErrorState
        title={title}
        description={description}
        onRetry={() => router.refresh()}
      />
    </div>
  );
}
