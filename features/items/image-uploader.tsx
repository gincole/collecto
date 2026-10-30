"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({
  error,
  itemId,
  hasImage,
}: {
  error?: string;
  itemId?: string;
  hasImage: boolean;
}) {
  const [preview, setPreview] = useState<string>();
  const [removed, setRemoved] = useState(false);
  const [clientError, setClientError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const displayedUrl =
    preview ??
    (!removed && hasImage && itemId ? `/api/items/${itemId}/image` : undefined);

  return (
    <section className="space-y-3" aria-labelledby="item-image-label">
      <div>
        <h2 className="font-semibold" id="item-image-label">
          Image (optional)
        </h2>
        <p className="text-muted-foreground text-sm">
          JPEG, PNG, or WebP, up to 5 MB.
        </p>
      </div>
      {displayedUrl ? (
        <div className="border-border bg-muted/30 overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element -- private object URL or authenticated route */}
          <img
            alt="Item preview"
            className="aspect-[4/3] w-full object-contain"
            src={displayedUrl}
          />
        </div>
      ) : (
        <div className="border-border text-muted-foreground flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed">
          <ImagePlus aria-hidden="true" className="mr-2 size-5" /> No image
          selected
        </div>
      )}
      <input
        name="removeImage"
        type="hidden"
        value={removed ? "true" : "false"}
      />
      <div className="flex flex-wrap gap-2">
        <label className="border-control-border hover:bg-muted focus-within:ring-focus/20 inline-flex min-h-11 cursor-pointer items-center rounded-md border px-4 py-2 font-medium focus-within:ring-4">
          {displayedUrl ? "Replace image" : "Choose image"}
          <input
            accept={acceptedTypes.join(",")}
            aria-label="Item image"
            aria-describedby={error || clientError ? "image-error" : undefined}
            aria-invalid={Boolean(error || clientError)}
            className="sr-only"
            name="image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (
                !acceptedTypes.includes(file.type) ||
                file.size > 5 * 1024 * 1024
              ) {
                setClientError(
                  "Choose a JPEG, PNG, or WebP image that is 5 MB or smaller.",
                );
                event.target.value = "";
                return;
              }
              if (preview) URL.revokeObjectURL(preview);
              setPreview(URL.createObjectURL(file));
              setRemoved(false);
              setClientError(undefined);
            }}
            type="file"
            ref={inputRef}
          />
        </label>
        {displayedUrl ? (
          <Button
            onClick={() => {
              if (preview) URL.revokeObjectURL(preview);
              setPreview(undefined);
              setRemoved(true);
              if (inputRef.current) inputRef.current.value = "";
            }}
            type="button"
            variant="outline"
          >
            <Trash2 aria-hidden="true" className="size-4" /> Remove
          </Button>
        ) : null}
        {!preview && !removed && hasImage && itemId ? (
          <Button asChild variant="outline">
            <a
              href={`/api/items/${itemId}/image`}
              rel="noreferrer"
              target="_blank"
            >
              View full size
            </a>
          </Button>
        ) : null}
      </div>
      {error || clientError ? (
        <p className="text-error text-sm" id="image-error">
          {error ?? clientError}
        </p>
      ) : null}
    </section>
  );
}
