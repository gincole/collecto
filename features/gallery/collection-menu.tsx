"use client";
import { useRef, useState } from "react";
import { Ellipsis, Settings2, LayoutGrid, Trash2 } from "lucide-react";
import Link from "@/components/shared/navigation-link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { CollectionRecord } from "@/features/collections/models";
import type { ItemRecord } from "@/features/items/types";
import { GallerySettings } from "./gallery-settings";
import { saveGalleryConfigAction } from "./actions";

export function CollectionMenu({
  collection,
  items,
}: {
  collection: CollectionRecord;
  items: ItemRecord[];
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            data-collection-menu-trigger
            type="button"
            size="icon"
            variant="outline"
            aria-label={`Collection actions for ${collection.name}`}
          >
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/collections/${collection.id}/settings`}>
              <Settings2 aria-hidden="true" />
              Collection settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setGalleryOpen(true)}>
            <LayoutGrid aria-hidden="true" />
            Gallery settings
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-destructive">
            <Link
              href={`/collections/${collection.id}/settings#delete-collection`}
            >
              <Trash2 aria-hidden="true" />
              Delete
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {galleryOpen ? (
        <GallerySettings
          collection={collection}
          items={items}
          saveAction={saveGalleryConfigAction}
          returnFocus={triggerRef}
          open={galleryOpen}
          setOpen={setGalleryOpen}
        />
      ) : null}
    </>
  );
}
