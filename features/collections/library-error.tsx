"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/shared";

export function LibraryError() {
  const router = useRouter();

  return (
    <ErrorState
      description="Your collections could not be loaded. Check your connection and try again."
      onRetry={() => router.refresh()}
      title="Could not load your library"
    />
  );
}
