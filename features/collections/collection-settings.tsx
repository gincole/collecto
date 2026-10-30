"use client";
import { ConfirmationDialogContent } from "@/components/shared/confirmation-dialog-content";
import { FormSectionHeader } from "@/components/shared/form-section-header";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useId,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { FeedbackMessage } from "@/components/shared/feedback-message";
import { useFeedback } from "@/components/shared/feedback";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/form-control";
import { ModalActions, useFlowExit } from "@/components/shared/flow-modal";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

import type { CollectionSettingsState } from "./actions";
import type { CollectionRecord } from "./models";

const initialState: CollectionSettingsState = { status: "idle" };

type SettingsAction = (
  previousState: CollectionSettingsState,
  formData: FormData,
) => Promise<CollectionSettingsState>;

type CollectionSettingsProps = {
  children?: ReactNode;
  active?: boolean;
  initialSection?: "delete";
  collection: CollectionRecord;
  deleteAction: SettingsAction;
  updateAction: SettingsAction;
};

export function CollectionSettings({
  children,
  active = true,
  initialSection,
  collection,
  deleteAction,
  updateAction,
}: CollectionSettingsProps) {
  const formId = useId();
  const deleteFormId = useId();
  const deleteSectionRef = useCallback(
    (node: HTMLElement | null) => {
      if (initialSection === "delete") node?.scrollIntoView({ block: "start" });
    },
    [initialSection],
  );
  const notify = useFeedback();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [confirmationName, setConfirmationName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    initialState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    initialState,
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const dismissFlow = useFlowExit(undefined, updatePending || deletePending);

  const savedIdentity = updateState.savedIdentity ?? {
    description: collection.description ?? "",
    name: collection.name,
  };
  const dirty =
    name !== savedIdentity.name || description !== savedIdentity.description;
  const populated =
    collection.itemCount > 0 || Boolean(deleteState.requiredConfirmationName);
  const requiredConfirmationName =
    deleteState.requiredConfirmationName ?? collection.name;
  const deletionConfirmed =
    !populated || confirmationName === requiredConfirmationName;

  useEffect(() => {
    if (updateState.fieldErrors?.name) nameRef.current?.focus();
    else if (updateState.fieldErrors?.description)
      document.getElementById("collection-description")?.focus();
    if (updateState.status === "success") {
      notify("Collection settings saved.");
      dismissFlow?.();
    }
    if (updateState.status === "error")
      notify(
        updateState.message ?? "Review the highlighted fields and try again.",
        "error",
      );
  }, [updateState, notify, dismissFlow]);
  useEffect(() => {
    if (deleteState.status === "error")
      notify(
        deleteState.message ??
          "Review the deletion confirmation and try again.",
        "error",
      );
  }, [deleteState, notify]);

  function handleDeleteOpenChange(open: boolean) {
    if (deletePending) return;
    setDeleteOpen(open);
    if (!open) setConfirmationName("");
  }

  return (
    <div className={dismissFlow ? "space-y-6" : "space-y-6 pt-6"}>
      <section
        data-form-panel
        aria-labelledby="collection-general-heading"
        className="border-border bg-surface rounded-card sm:p-panel border p-4"
      >
        <FormSectionHeader
          id="collection-general-heading"
          title="General"
          description="Update the name and description shown in your Library."
        />
        <form
          id={formId}
          noValidate
          action={updateFormAction}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="text-label block" htmlFor="collection-name">
              Collection name
            </label>
            <Input
              aria-describedby={
                updateState.fieldErrors?.name
                  ? "collection-name-error"
                  : undefined
              }
              aria-invalid={Boolean(updateState.fieldErrors?.name)}
              id="collection-name"
              maxLength={DATABASE_LIMITS.collectionName}
              name="name"
              onChange={(event) => setName(event.target.value)}
              ref={nameRef}
              required
              value={name}
            />
            {updateState.fieldErrors?.name ? (
              <p className="text-error text-sm" id="collection-name-error">
                {updateState.fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label
              className="text-label block"
              htmlFor="collection-description"
            >
              Description (optional)
            </label>
            <Textarea
              aria-describedby={
                updateState.fieldErrors?.description
                  ? "collection-description-error"
                  : undefined
              }
              aria-invalid={Boolean(updateState.fieldErrors?.description)}
              id="collection-description"
              maxLength={DATABASE_LIMITS.collectionDescription}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
            {updateState.fieldErrors?.description ? (
              <p
                className="text-error text-sm"
                id="collection-description-error"
              >
                {updateState.fieldErrors.description}
              </p>
            ) : null}
          </div>
          {updateState.status === "error" && updateState.message ? (
            <FeedbackMessage
              kind={updateState.status === "error" ? "error" : "success"}
            >
              {updateState.message}
            </FeedbackMessage>
          ) : null}
          {updateState.status === "error" && !updateState.message ? (
            <FeedbackMessage kind="error">
              Review the highlighted fields and try again.
            </FeedbackMessage>
          ) : null}
          {active ? (
            <ModalActions>
              <Button
                form={formId}
                aria-busy={updatePending}
                disabled={!dirty || updatePending}
                type="submit"
              >
                {updatePending ? "Saving…" : "Save changes"}
              </Button>
            </ModalActions>
          ) : null}
        </form>
      </section>

      {children}

      <section
        data-form-panel
        aria-labelledby="delete-collection-heading"
        className="border-destructive/40 bg-surface rounded-card sm:p-panel border p-4"
        id="delete-collection"
        ref={deleteSectionRef}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <FormSectionHeader
            id="delete-collection-heading"
            title="Delete collection"
            description="Permanently delete this Collection, all of its Items, and its private images. This cannot be undone."
            className="mb-0"
          />
          <Dialog onOpenChange={handleDeleteOpenChange} open={deleteOpen}>
            <DialogTrigger asChild>
              <DeleteButton aria-label="Delete collection" />
            </DialogTrigger>
            <ConfirmationDialogContent
              role="alertdialog"
              closeDisabled={deletePending}
              onEscapeKeyDown={(event) => {
                if (deletePending) event.preventDefault();
              }}
              onInteractOutside={(event) => {
                if (deletePending) event.preventDefault();
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Permanently delete {collection.name}?
                </DialogTitle>
              </DialogHeader>
              <DialogBody className="space-y-5">
                <DialogDescription className="text-foreground-muted text-base leading-6">
                  This permanently deletes {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "item" : "items"}, its field
                  setup, and {collection.imageCount}{" "}
                  {collection.imageCount === 1
                    ? "private image"
                    : "private images"}
                  . There is no trash or undo.
                </DialogDescription>
                <form
                  id={deleteFormId}
                  noValidate
                  action={deleteFormAction}
                  className="space-y-4"
                >
                  {populated ? (
                    <div className="space-y-2">
                      <label
                        className="font-semibold"
                        htmlFor="delete-confirmation-name"
                      >
                        Type {requiredConfirmationName} to confirm
                      </label>
                      <Input
                        aria-describedby={
                          deleteState.fieldErrors?.confirmationName
                            ? "delete-confirmation-error"
                            : undefined
                        }
                        aria-invalid={Boolean(
                          deleteState.fieldErrors?.confirmationName,
                        )}
                        autoComplete="off"
                        id="delete-confirmation-name"
                        maxLength={DATABASE_LIMITS.collectionName}
                        name="confirmationName"
                        onChange={(event) =>
                          setConfirmationName(event.target.value)
                        }
                        value={confirmationName}
                      />
                      {deleteState.fieldErrors?.confirmationName ? (
                        <p
                          className="text-error text-sm"
                          id="delete-confirmation-error"
                        >
                          {deleteState.fieldErrors.confirmationName}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <input name="confirmationName" type="hidden" value="" />
                  )}
                  {deleteState.message ? (
                    <p className="text-error" role="alert">
                      {deleteState.message}
                    </p>
                  ) : null}
                </form>
              </DialogBody>
              <DialogFooter>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <DeleteButton
                    confirm
                    pending={deletePending}
                    form={deleteFormId}
                    disabled={!deletionConfirmed || deletePending}
                    type="submit"
                  />
                </div>
              </DialogFooter>
            </ConfirmationDialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  );
}
