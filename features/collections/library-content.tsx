"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FlowModal } from "@/components/shared/flow-modal";
import { CollectionWizard } from "./collection-wizard";
import { createCollectionFromWizardAction } from "./actions";
import { LibraryView } from "./library-view";
import { LibraryError } from "./library-error";
import { SettingsModal } from "./settings-modal";
import type { CollectionRecord } from "./models";

export function LibraryContent({
  collections,
}: {
  collections: CollectionRecord[] | null;
}) {
  const [dialog, setDialog] = useState<
    | { kind: "create" }
    | { kind: "settings"; id: string; section?: "delete" }
    | null
  >(null);
  const opener = useRef<HTMLElement | null>(null);
  function close() {
    setDialog(null);
  }
  function create() {
    opener.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setDialog({ kind: "create" });
  }
  const collection =
    dialog?.kind === "settings"
      ? collections?.find((c) => c.id === dialog.id)
      : null;
  return (
    <>
      <header className="flex flex-col gap-5 py-2 sm:flex-row sm:items-end sm:justify-between sm:py-4">
        <div className="space-y-2">
          <p className="text-foreground-muted text-sm">
            Your private collection space
          </p>
          <h1 className="text-display-mobile sm:text-display">
            My Collections
          </h1>
          <p className="text-foreground-muted max-w-xl">
            A home for everything you love, notice, and want to keep close.
          </p>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          size="lg"
          onClick={create}
        >
          New collection
        </Button>
      </header>
      <section aria-label="Collections" className="sm:pt-section pt-8">
        {collections ? (
          <LibraryView
            collections={collections}
            onCreate={create}
            onSettings={(collection, section, trigger) => {
              opener.current = trigger;
              setDialog({ kind: "settings", id: collection.id, section });
            }}
          />
        ) : (
          <LibraryError />
        )}
      </section>
      {dialog?.kind === "create" ? (
        <FlowModal title="New collection" onClose={close} returnFocus={opener}>
          <CollectionWizard
            modal
            createAction={createCollectionFromWizardAction}
          />
        </FlowModal>
      ) : null}
      {collection ? (
        <SettingsModal
          collection={collection}
          initialSection={
            dialog?.kind === "settings" ? dialog.section : undefined
          }
          onClose={close}
          returnFocus={opener}
        />
      ) : null}
    </>
  );
}
