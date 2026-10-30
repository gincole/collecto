"use client";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AddFieldForm } from "@/features/fields/add-field-form";
import { EditFieldForm } from "@/features/fields/field-editors";
import { useFeedback } from "@/components/shared/feedback";
import { fieldActionsWithFeedback } from "@/features/fields/feedback-actions";
import { FlowModal, ModalActions } from "@/components/shared/flow-modal";
import { Button } from "@/components/ui/button";
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
  const [step, setStep] = useState<"settings" | "add-field" | "edit-field">(
    "settings",
  );
  const [editFieldId, setEditFieldId] = useState<string>();
  const editField = collection.fields.find((field) => field.id === editFieldId);
  const restoreTarget = useRef<HTMLButtonElement | null>(null);
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
      (restoreTarget.current?.isConnected
        ? restoreTarget.current
        : addFieldTriggerRef.current
      )?.focus();
    }
  }, [step]);
  return (
    <FlowModal
      title={
        step === "settings"
          ? "Collection settings"
          : step === "add-field"
            ? "Add custom field"
            : `Edit ${editField?.name ?? "field"}`
      }
      onClose={onClose}
      returnFocus={returnFocus}
    >
      <div hidden={step !== "settings"}>
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
            onAddField={() => {
              restoreTarget.current = addFieldTriggerRef.current;
              setStep("add-field");
            }}
            onEditField={(field, trigger) => {
              restoreTarget.current = trigger;
              setEditFieldId(field.id);
              setStep("edit-field");
            }}
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
      {step === "edit-field" ? (
        editField ? (
          <EditFieldForm
            key={editField.id}
            actions={actions}
            collectionId={collection.id}
            field={editField}
            cancelLabel="Back"
            onCancel={showSettings}
            onSaved={showSettings}
            onDeleted={() => {
              restoreTarget.current = addFieldTriggerRef.current;
              showSettings();
            }}
          />
        ) : (
          <>
            <p role="alert">This Field is no longer available.</p>
            <ModalActions>
              <Button onClick={showSettings} variant="outline">
                Back
              </Button>
            </ModalActions>
          </>
        )
      ) : null}
    </FlowModal>
  );
}
