"use client";
import { LoadingImage } from "@/components/shared/loading-image";

import { ImageOff } from "lucide-react";
import { useState } from "react";

import type { GalleryConfig } from "@/features/collections/schemas";
import type { ItemRecord } from "@/features/items/types";
import { cn } from "@/lib/utils/cn";

const ratioClasses: Record<GalleryConfig["aspectRatio"], string> = {
  "1:1": "aspect-square",
  "2:3": "aspect-[2/3]",
  "3:4": "aspect-[3/4]",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
};

export function GalleryImage({
  aspectRatio,
  imageFit,
  item,
}: {
  aspectRatio: GalleryConfig["aspectRatio"];
  imageFit: GalleryConfig["imageFit"];
  item: ItemRecord;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "bg-surface-muted text-foreground-muted relative flex w-full items-center justify-center overflow-hidden",
        ratioClasses[aspectRatio],
      )}
      data-testid="gallery-image"
    >
      {!item.imagePath || failed ? (
        <span className="flex flex-col items-center gap-2 text-sm">
          <ImageOff aria-hidden="true" className="size-5" />
          <span className="sr-only">No image</span>
        </span>
      ) : (
        <LoadingImage
          alt=""
          decoding="async"
          className={cn(
            "absolute inset-0 size-full",
            imageFit === "cover" ? "object-cover" : "object-contain",
          )}
          onError={() => setFailed(true)}
          loading="lazy"
          src={`/api/items/${item.id}/image`}
        />
      )}
    </div>
  );
}
