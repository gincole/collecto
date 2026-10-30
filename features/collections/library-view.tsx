"use client";
import { DisplayName } from "@/components/shared/display-name";
import { useRef } from "react";
import { Ellipsis, PackageOpen, Pencil, Trash2 } from "lucide-react";
import Link from "@/components/shared/navigation-link";

import { EmptyState, PresetArtwork } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cardHoverMotion } from "@/lib/design/card-motion";
import { cn } from "@/lib/utils/cn";

import type { CollectionRecord } from "./models";

type LibraryViewProps = {
  collections: CollectionRecord[];
  onCreate?: () => void;
  onSettings?: (
    collection: CollectionRecord,
    section: "delete" | undefined,
    trigger: HTMLElement | null,
  ) => void;
};

function itemCountLabel(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function LibraryView({
  collections,
  onCreate,
  onSettings,
}: LibraryViewProps) {
  if (collections.length === 0) {
    return (
      <EmptyState
        action={
          <Button type="button" onClick={onCreate}>
            Create your first collection
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
          <article
            className={cn(
              "border-border bg-surface rounded-card relative h-full border",
              cardHoverMotion,
            )}
          >
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
                <DisplayName
                  as="h2"
                  className="text-card-title-mobile sm:text-card-title"
                >
                  {collection.name}
                </DisplayName>
                <p className="text-foreground-muted text-sm">
                  {itemCountLabel(collection.itemCount)}
                </p>
              </div>
            </Link>
            <div className="absolute right-3 bottom-3">
              <LibraryCollectionMenu
                collection={collection}
                onSettings={onSettings}
              />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

function LibraryCollectionMenu({
  collection,
  onSettings,
}: {
  collection: CollectionRecord;
  onSettings: LibraryViewProps["onSettings"];
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Collection actions for ${collection.name}`}
        >
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          aria-label={`Rename ${collection.name}`}
          onSelect={() => onSettings?.(collection, undefined, trigger.current)}
        >
          <Pencil aria-hidden="true" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          aria-label={`Delete ${collection.name}`}
          onSelect={() => onSettings?.(collection, "delete", trigger.current)}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
