"use client";
import { useRef, useState } from "react";
import { Ellipsis, Settings2, LayoutGrid, Trash2 } from "lucide-react";
import { SettingsModal } from "@/features/collections/settings-modal";
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
  const [settings, setSettings] = useState<"general" | "delete" | null>(null);
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
          <DropdownMenuItem onSelect={() => setSettings("general")}>
            <Settings2 aria-hidden="true" />
            Collection settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setGalleryOpen(true)}>
            <LayoutGrid aria-hidden="true" />
            Gallery settings
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setSettings("delete")}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {settings ? (
        <SettingsModal
          collection={collection}
          onClose={() => setSettings(null)}
          initialSection={settings === "delete" ? "delete" : undefined}
          returnFocus={triggerRef}
        />
      ) : null}
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
