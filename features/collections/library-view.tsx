import { Ellipsis, PackageOpen } from "lucide-react";
import type { Route } from "next";
import Link from "@/components/shared/navigation-link";

import { EmptyState, PresetArtwork } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DeleteMenuLink } from "@/components/shared/delete-button";

import type { CollectionRecord } from "./models";

type LibraryViewProps = { collections: CollectionRecord[] };

function itemCountLabel(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function LibraryView({ collections }: LibraryViewProps) {
  if (collections.length === 0) {
    return (
      <EmptyState
        action={
          <Button asChild>
            <Link href="/collections/new">Create your first collection</Link>
          </Button>
        }
        description="Make a home for the books, meals, places, and small things you want to remember."
        icon={<PackageOpen aria-hidden="true" />}
        title="No collections yet"
      />
    );
  }

  return (
    <ul className="grid min-w-0 grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {collections.map((collection) => (
        <li key={collection.id}>
          <article className="border-border bg-surface rounded-card duration-base ease-standard relative h-full border transition-[transform,border-color] motion-safe:hover:-translate-y-0.5">
            <Link
              aria-label={`Open ${collection.name}`}
              className="focus-ring rounded-card block h-full"
              href={`/collections/${collection.id}`}
            >
              <PresetArtwork
                className="rounded-t-card h-28 w-full rounded-b-none sm:h-36"
                presetKey={collection.presetKey ?? "blank"}
                size="lg"
              />
              <div className="sm:p-panel space-y-2 p-4 pr-12 sm:pr-14">
                <h2 className="text-card-title-mobile sm:text-card-title line-clamp-2">
                  {collection.name}
                </h2>
                <p className="text-foreground-muted text-sm">
                  {itemCountLabel(collection.itemCount)}
                </p>
              </div>
            </Link>
            <details className="group absolute right-3 bottom-3">
              <summary
                aria-label={`Collection actions for ${collection.name}`}
                className="touch-target focus-ring hover:bg-surface-muted rounded-control flex cursor-pointer list-none items-center justify-center [&::-webkit-details-marker]:hidden"
              >
                <Ellipsis aria-hidden="true" className="size-5" />
              </summary>
              <div className="border-border bg-surface shadow-sheet rounded-control absolute right-0 bottom-full z-10 mb-1 w-40 border p-1">
                <Link
                  aria-label={`Rename ${collection.name}`}
                  className="touch-target hover:bg-surface-muted focus-ring rounded-control flex w-full items-center px-3 text-left text-sm"
                  href={`/collections/${collection.id}/settings` as Route}
                >
                  Rename
                </Link>
                <DeleteMenuLink
                  aria-label={`Delete ${collection.name}`}
                  href={
                    `/collections/${collection.id}/settings#delete-collection` as Route
                  }
                />
              </div>
            </details>
          </article>
        </li>
      ))}
    </ul>
  );
}
