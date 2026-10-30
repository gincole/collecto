"use client";

import { useState, type ComponentProps } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// The caller reserves the image's aspect ratio and handles recoverable failures.
export function LoadingImage({
  src,
  onLoad,
  onError,
  alt,
  ...props
}: ComponentProps<"img">) {
  const [settledSource, setSettledSource] = useState<typeof src>();
  return (
    <>
      {settledSource !== src ? (
        <div
          role="status"
          aria-label="Loading image"
          className="pointer-events-none absolute inset-0 z-10"
        >
          <Skeleton className="size-full rounded-none" />
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated route or local object URL */}
      <img
        {...props}
        alt={alt}
        src={src}
        ref={(image) => {
          if (image?.complete && image.naturalWidth > 0) setSettledSource(src);
        }}
        onLoad={(event) => {
          setSettledSource(src);
          onLoad?.(event);
        }}
        onError={(event) => {
          setSettledSource(src);
          onError?.(event);
        }}
      />
    </>
  );
}
