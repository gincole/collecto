import { EmptyState, PresetArtwork } from "@/components/shared";
import { AddItemButton } from "@/features/items/add-item-button";
import { CollectionMenu } from "./collection-menu";
import { BackLink } from "@/components/shared/back-link";
import type { CollectionRecord } from "@/features/collections/models";
import type { ItemRecord } from "@/features/items/types";
import { GalleryGrid } from "./gallery-grid";

export function CollectionHeader({
  collection,
  items = [],
}: {
  collection: CollectionRecord;
  items?: ItemRecord[];
}) {
  return (
    <header className="flex flex-wrap items-center gap-4 py-3 sm:gap-6 sm:py-6">
      <div className="w-full">
        <BackLink href="/library">Back</BackLink>
      </div>
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
        <AddItemButton collection={collection} />
        <CollectionMenu collection={collection} items={items} />
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
            <AddItemButton collection={collection}>
              {folderName ? "Add item" : "Add your first item"}
            </AddItemButton>
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
