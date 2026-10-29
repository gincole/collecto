"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/form-control";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

import type { CollectionSettingsState } from "./actions";
import type { CollectionRecord } from "./models";

const initialState: CollectionSettingsState = { status: "idle" };

type SettingsAction = (
  previousState: CollectionSettingsState,
  formData: FormData,
) => Promise<CollectionSettingsState>;

type CollectionSettingsProps = {
  collection: CollectionRecord;
  deleteAction: SettingsAction;
  updateAction: SettingsAction;
};

export function CollectionSettings({
  collection,
  deleteAction,
  updateAction,
}: CollectionSettingsProps) {
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
  }, [updateState]);

  function handleDeleteOpenChange(open: boolean) {
    setDeleteOpen(open);
    if (!open) setConfirmationName("");
  }

  return (
    <div className="space-y-8 py-4 sm:py-8">
      <section
        aria-labelledby="collection-general-heading"
        className="border-border bg-surface rounded-card border p-4 sm:p-6"
      >
        <div className="mb-6 space-y-1">
          <h2 className="text-section-title" id="collection-general-heading">
            General
          </h2>
          <p className="text-foreground-muted">
            Update the name and description shown in your Library.
          </p>
        </div>
        <form action={updateFormAction} className="space-y-5">
          <div className="space-y-2">
            <label className="font-semibold" htmlFor="collection-name">
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
            <label className="font-semibold" htmlFor="collection-description">
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
          {updateState.message ? (
            <p
              className={
                updateState.status === "success" ? "text-success" : "text-error"
              }
              role={updateState.status === "error" ? "alert" : "status"}
            >
              {updateState.message}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button
              aria-busy={updatePending}
              disabled={!dirty || updatePending}
              type="submit"
            >
              {updatePending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="delete-collection-heading"
        className="border-destructive/40 bg-surface rounded-card border p-4 sm:p-6"
        id="delete-collection"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-section-title" id="delete-collection-heading">
              Delete collection
            </h2>
            <p className="text-foreground-muted">
              Permanently delete this Collection, all of its Items, and its
              private images. This cannot be undone.
            </p>
          </div>
          <Dialog onOpenChange={handleDeleteOpenChange} open={deleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 aria-hidden="true" />
                Delete collection
              </Button>
            </DialogTrigger>
            <DialogContent role="alertdialog" showCloseButton={false}>
              <div className="space-y-2">
                <DialogTitle className="text-xl font-semibold">
                  Permanently delete {collection.name}?
                </DialogTitle>
                <DialogDescription className="text-foreground-muted text-base leading-6">
                  This permanently deletes {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "item" : "items"}, its field
                  setup, and {collection.imageCount}{" "}
                  {collection.imageCount === 1
                    ? "private image"
                    : "private images"}
                  . There is no trash or undo.
                </DialogDescription>
              </div>
              <form action={deleteFormAction} className="space-y-4">
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
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <DialogClose asChild>
                    <Button
                      disabled={deletePending}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    aria-busy={deletePending}
                    disabled={!deletionConfirmed || deletePending}
                    type="submit"
                    variant="destructive"
                  >
                    {deletePending ? "Deleting…" : "Delete permanently"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  );
}
