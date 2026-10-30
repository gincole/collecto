"use client";

import { useSyncExternalStore } from "react";
import type { Route } from "next";
import Link from "@/components/shared/navigation-link";

import type { GalleryConfig } from "@/features/collections/schemas";
import type { ItemFieldDefinition, ItemRecord } from "@/features/items/types";
import { cn } from "@/lib/utils/cn";

import { GalleryImage } from "./gallery-image";
import { getGalleryDisplayValues, sortGalleryItems } from "./model";

const columnClasses: Record<GalleryConfig["columns"], string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 @[20.5rem]:grid-cols-2",
  3: "grid-cols-1 @[20.5rem]:grid-cols-2 @[42rem]:grid-cols-3",
  4: "grid-cols-1 @[20.5rem]:grid-cols-2 @[42rem]:grid-cols-3 @[56rem]:grid-cols-4",
  5: "grid-cols-1 @[20.5rem]:grid-cols-2 @[42rem]:grid-cols-3 @[56rem]:grid-cols-4 @[68rem]:grid-cols-5",
};

// The server snapshot keeps hydration stable; subsequent rendering uses browser locale.
const subscribe = () => () => {};
const browserLocale = () => navigator.language;
const serverLocale = () => undefined;

function GalleryCard({
  config,
  fields,
  item,
}: {
  config: GalleryConfig;
  fields: ItemFieldDefinition[];
  item: ItemRecord;
}) {
  const locale = useSyncExternalStore(subscribe, browserLocale, serverLocale);
  const displayValues = config.showDetails
    ? getGalleryDisplayValues(item, fields, config.visibleFieldIds, locale)
    : [];
  const horizontal = config.columns === 1;

  return (
    <article
      className={cn(
        "border-border bg-surface rounded-card duration-gallery ease-standard h-full border transition-[transform,border-color] motion-safe:hover:-translate-y-0.5",
        horizontal
          ? "grid grid-cols-[minmax(6rem,35%)_minmax(0,1fr)] items-center gap-4"
          : "@max-[20.5rem]:grid @max-[20.5rem]:grid-cols-[minmax(6rem,35%)_minmax(0,1fr)] @max-[20.5rem]:items-center @max-[20.5rem]:gap-4",
      )}
      data-layout={horizontal ? "horizontal" : "vertical"}
    >
      <GalleryImage
        aspectRatio={config.aspectRatio}
        imageFit={config.imageFit}
        item={item}
        key={item.imagePath ?? "no-image"}
      />
      {displayValues.length ? (
        <div
          className={cn(
            "sm:p-panel min-w-0 space-y-2 p-4",
            horizontal && "pl-0 sm:pl-0",
          )}
        >
          {displayValues.map((value, index) => (
            <p
              className={cn(
                "line-clamp-2 break-words",
                index === 0
                  ? "text-card-title-mobile sm:text-card-title font-semibold"
                  : "text-foreground-muted text-sm",
              )}
              key={`${index}-${value}`}
            >
              {value}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function GalleryGrid({
  collectionId,
  config,
  fields,
  items,
  preview = false,
}: {
  collectionId: string;
  config: GalleryConfig;
  fields: ItemFieldDefinition[];
  items: ItemRecord[];
  preview?: boolean;
}) {
  const locale = useSyncExternalStore(subscribe, browserLocale, serverLocale);
  const sortedItems = sortGalleryItems(
    items,
    config.sortBy,
    config.sortDirection,
    locale,
  );

  return (
    <div className="@container min-w-0">
      <ul
        className={cn(
          "grid min-w-0",
          columnClasses[config.columns],
          config.spacing === "tight" ? "gap-2" : "gap-4 sm:gap-5",
        )}
      >
        {(preview ? sortedItems.slice(0, 5) : sortedItems).map((item) => (
          <li className="min-w-0" key={item.id}>
            {preview ? (
              <GalleryCard config={config} fields={fields} item={item} />
            ) : (
              <Link
                aria-label={`Open ${item.title}`}
                className="focus-ring rounded-card block h-full"
                href={`/collections/${collectionId}/items/${item.id}` as Route}
              >
                <GalleryCard config={config} fields={fields} item={item} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { GalleryCard };
