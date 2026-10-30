"use client";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AddFieldForm } from "@/features/fields/add-field-form";
import { useFeedback } from "@/components/shared/feedback";
import { fieldActionsWithFeedback } from "@/features/fields/feedback-actions";
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
  const [step, setStep] = useState<"settings" | "add-field">("settings");
  const addFieldTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const notify = useFeedback();
  const actions = useMemo(
    () => fieldActionsWithFeedback(fieldActions, notify),
    [notify],
  );
  function showSettings() {
    restoreFocus.current = true;
    setStep("settings");
  }
  useEffect(() => {
    if (step === "settings" && restoreFocus.current) {
      restoreFocus.current = false;
      addFieldTriggerRef.current?.focus();
    }
  }, [step]);
  return (
    <FlowModal
      title={step === "settings" ? "Collection settings" : "Add custom field"}
      onClose={onClose}
      returnFocus={returnFocus}
    >
      <div hidden={step !== "settings"}>
        <p className="text-foreground-muted">{collection.name}</p>
        <CollectionSettings
          active={step === "settings"}
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
            onAddField={() => setStep("add-field")}
            addFieldTriggerRef={addFieldTriggerRef}
            actions={fieldActions}
            collectionId={collection.id}
            fields={collection.fields}
          />
        </CollectionSettings>
      </div>
      {step === "add-field" ? (
        <AddFieldForm
          actions={actions}
          collectionId={collection.id}
          cancelLabel="Back"
          onCancel={showSettings}
          onCreated={showSettings}
        />
      ) : null}
    </FlowModal>
  );
}
