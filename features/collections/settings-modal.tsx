"use client";
import { type RefObject } from "react";
import { FlowModal } from "@/components/shared/flow-modal";
import { FieldManager } from "@/features/fields/field-manager";
import { fieldActions } from "@/features/fields/action-bindings";
import {
  deleteCollectionFromSettingsAction,
  updateCollectionFromSettingsAction,
} from "./actions";
import { CollectionSettings } from "./collection-settings";
import type { CollectionRecord } from "./models";

export function SettingsModal({
  collection,
  onClose,
  initialSection,
  returnFocus,
}: {
  collection: CollectionRecord;
  onClose: () => void;
  initialSection?: "delete";
  returnFocus?: RefObject<HTMLElement | null>;
}) {
  return (
    <FlowModal
      title="Collection settings"
      onClose={onClose}
      returnFocus={returnFocus}
    >
      <p className="text-foreground-muted">{collection.name}</p>
      <CollectionSettings
        collection={collection}
        initialSection={initialSection}
        deleteAction={deleteCollectionFromSettingsAction.bind(
          null,
          collection.id,
        )}
        updateAction={updateCollectionFromSettingsAction.bind(
          null,
          collection.id,
        )}
      >
        <FieldManager
          actions={fieldActions}
          collectionId={collection.id}
          fields={collection.fields}
        />
      </CollectionSettings>
    </FlowModal>
  );
}
