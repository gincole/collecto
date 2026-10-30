import { Ellipsis } from "lucide-react";
import type { Route } from "next";
import Link from "@/components/shared/navigation-link";

import { EmptyState, PresetArtwork } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DeleteMenuLink } from "@/components/shared/delete-button";
import type { CollectionRecord } from "@/features/collections/models";
import type { ItemRecord } from "@/features/items/types";
import { GalleryGrid } from "./gallery-grid";

export function CollectionHeader({
  collection,
}: {
  collection: CollectionRecord;
}) {
  return (
    <header className="flex flex-wrap items-center gap-4 py-3 sm:gap-6 sm:py-6">
      <PresetArtwork presetKey={collection.presetKey ?? "blank"} size="lg" />
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="text-page-title-mobile sm:text-page-title break-words">
          {collection.name}
        </h1>
        {collection.description ? (
          <p className="text-foreground-muted break-words">
            {collection.description}
          </p>
        ) : null}
        <p className="text-foreground-muted text-sm">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button asChild>
          <Link href={`/collections/${collection.id}/items/new` as Route}>
            Add item
          </Link>
        </Button>
        <details className="relative">
          <summary
            aria-label={`Collection actions for ${collection.name}`}
            className="touch-target focus-ring border-control-border bg-surface hover:bg-surface-muted rounded-control flex cursor-pointer list-none items-center justify-center border [&::-webkit-details-marker]:hidden"
          >
            <Ellipsis aria-hidden="true" className="size-5" />
          </summary>
          <div className="border-border bg-surface shadow-sheet rounded-control absolute right-0 z-20 mt-1 w-48 border p-1">
            <Link
              className="touch-target hover:bg-surface-muted focus-ring rounded-control flex items-center px-3 text-sm"
              href={`/collections/${collection.id}/settings` as Route}
            >
              Collection settings
            </Link>
            <DeleteMenuLink
              aria-label="Delete collection"
              href={
                `/collections/${collection.id}/settings#delete-collection` as Route
              }
            />
          </div>
        </details>
      </div>
    </header>
  );
}

export function CollectionGallery({
  collection,
  items,
  folderName,
}: {
  collection: CollectionRecord;
  items: ItemRecord[];
  folderName?: string;
}) {
  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href={`/collections/${collection.id}/items/new` as Route}>
                {folderName ? "Add item" : "Add your first item"}
              </Link>
            </Button>
          }
          description={
            folderName
              ? "Add an Item, then choose its Select value to place it in this folder."
              : "This Collection is ready for the things you want to remember."
          }
          title={folderName ? "No items in this folder" : "No items yet"}
        />
      ) : (
        <GalleryGrid
          collectionId={collection.id}
          config={collection.viewConfig}
          fields={collection.fields}
          items={items}
        />
      )}
    </div>
  );
}
