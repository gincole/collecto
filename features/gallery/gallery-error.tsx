"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/shared";

export function GalleryError({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const router = useRouter();
  return (
    <ErrorState
      description={description}
      onRetry={() => router.refresh()}
      title={title}
    />
  );
}
