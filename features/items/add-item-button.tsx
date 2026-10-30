"use client";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FlowModal } from "@/components/shared/flow-modal";
import type { CollectionRecord } from "@/features/collections/models";
import { ItemForm } from "./item-form";
import { createItemFromFormAction } from "./actions";

export function AddItemButton({
  collection,
  children = "Add item",
}: {
  collection: CollectionRecord;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={trigger} type="button" onClick={() => setOpen(true)}>
        {children}
      </Button>
      {open ? (
        <FlowModal
          title="Add item"
          onClose={() => setOpen(false)}
          returnFocus={trigger}
        >
          <ItemForm
            action={createItemFromFormAction}
            collectionId={collection.id}
            fields={collection.fields}
            mode="create"
            modal
          />
        </FlowModal>
      ) : null}
    </>
  );
}
