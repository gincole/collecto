"use client";
import { NavigationCard } from "@/components/shared/navigation-card";
import { useRef } from "react";
import { Ellipsis, PackageOpen, Pencil, Trash2 } from "lucide-react";

import { EmptyState, PresetArtwork } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
    <ul className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {collections.map((collection) => (
        <li className="min-w-0" key={collection.id}>
          <NavigationCard
            name={collection.name}
            count={collection.itemCount}
            label={`Open ${collection.name}`}
            href={`/collections/${collection.id}`}
            artwork={
              <PresetArtwork
                presetKey={collection.presetKey ?? "blank"}
                size="lg"
                variant="cover"
              />
            }
            actions={
              <LibraryCollectionMenu
                collection={collection}
                onSettings={onSettings}
              />
            }
          />
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
