import { ArrowLeft, FolderOpen } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { CollectionRecord } from "@/features/collections/models";
import type { ItemRecord } from "@/features/items/types";
import { cn } from "@/lib/utils/cn";
import {
  browseHref,
  getBrowseFolders,
  itemFolderId,
  UNCATEGORIZED,
  type BrowseState,
} from "./browse";
import { CollectionGallery } from "./collection-gallery";
import { GallerySettings } from "./gallery-settings";
import { saveGalleryConfigAction } from "./actions";

export function BrowseView({
  collection,
  items,
  state,
}: {
  collection: CollectionRecord;
  items: ItemRecord[];
  state: BrowseState;
}) {
  const fields = collection.fields.filter((field) => field.type === "select");
  const field = fields.find((field) => field.id === state.fieldId);
  const folderName =
    state.optionId === UNCATEGORIZED
      ? "Uncategorized"
      : field?.options.find((option) => option.id === state.optionId)?.label;
  const folderItems =
    field && state.optionId
      ? items.filter((item) => itemFolderId(item, field) === state.optionId)
      : items;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Browse by" className="min-w-0 overflow-x-auto pb-1">
          <div className="flex w-max gap-2">
            {[{ id: null, name: "All" }, ...fields].map((tab) => (
              <Link
                key={tab.id ?? "all"}
                href={
                  browseHref(collection.id, {
                    fieldId: tab.id,
                    optionId: null,
                  }) as Route
                }
                aria-current={
                  (field?.id ?? null) === tab.id ? "page" : undefined
                }
                className={cn(
                  "touch-target focus-ring rounded-control inline-flex shrink-0 items-center justify-center border px-4 text-sm font-semibold whitespace-nowrap",
                  (field?.id ?? null) === tab.id
                    ? "border-selection-border bg-art-lavender"
                    : "border-border bg-surface hover:bg-surface-muted",
                )}
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </nav>
        <div className="shrink-0">
          <GallerySettings
            collection={collection}
            items={items}
            saveAction={saveGalleryConfigAction}
          />
        </div>
      </div>
      {field && !state.optionId ? (
        <section aria-label={`${field.name} folders`} className="space-y-4">
          <h2 className="text-section-title-mobile sm:text-section-title break-words">
            Browse by {field.name}
          </h2>
          <ul className="grid min-w-0 grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {getBrowseFolders(field, items).map((folder) => (
              <li className="min-w-0" key={folder.id}>
                <Link
                  aria-label={`Open ${folder.label}, ${folder.count} ${folder.count === 1 ? "item" : "items"}`}
                  className="focus-ring border-border bg-surface rounded-card duration-base block h-full border p-3 transition-transform motion-safe:hover:-translate-y-0.5"
                  href={
                    browseHref(collection.id, {
                      fieldId: field.id,
                      optionId: folder.id,
                    }) as Route
                  }
                >
                  <div className="bg-art-sage rounded-control text-foreground flex h-28 items-center justify-center">
                    <FolderOpen aria-hidden="true" className="size-10" />
                  </div>
                  <h3 className="text-card-title-mobile mt-3 font-semibold break-words">
                    {folder.label}
                  </h3>
                  <p className="text-foreground-muted mt-1 text-sm">
                    {folder.count} {folder.count === 1 ? "item" : "items"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {field && folderName ? (
            <div className="space-y-3">
              <Link
                className="touch-target focus-ring rounded-control inline-flex max-w-full items-center gap-2 text-sm font-semibold break-words"
                href={
                  browseHref(collection.id, {
                    fieldId: field.id,
                    optionId: null,
                  }) as Route
                }
              >
                <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
                Back to {field.name} folders
              </Link>
              <h2 className="text-section-title-mobile sm:text-section-title break-words">
                {folderName}
              </h2>
              <p className="text-foreground-muted text-sm">
                {folderItems.length}{" "}
                {folderItems.length === 1 ? "item" : "items"}
              </p>
            </div>
          ) : null}
          <CollectionGallery
            collection={collection}
            items={folderItems}
            folderName={folderName}
          />
        </>
      )}
    </div>
  );
}
