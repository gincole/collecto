"use client";

import { Plus, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/form-control";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

import { ModalActions, useFlowBusy } from "@/components/shared/flow-modal";
import { DeleteFieldDialog, DeleteOptionDialog } from "./field-delete-dialogs";
import {
  editorClassName,
  errorMessage,
  move,
  type ActionResult,
  type Field,
  type FieldManagerActions,
} from "./field-manager-contract";
import { FieldTypeLabel } from "./field-type";
import { RequiredControl } from "./required-control";
import { AddFieldForm } from "./add-field-form";
import { ReorderButtons } from "./reorder-buttons";

function OptionEditor({
  actions,
  collectionId,
  field,
  onPendingChange,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  field: Field;
  onPendingChange: (pending: boolean) => void;
}) {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      field.options.map((option) => [option.id, option.label]),
    ),
  );
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const optionRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const newLabelRef = useRef<HTMLInputElement>(null);
  const atLimit = field.options.length >= DATABASE_LIMITS.selectOptions;

  useEffect(() => onPendingChange(pending), [onPendingChange, pending]);

  function runOption(
    operation: () => Promise<ActionResult>,
    focusOnFailure?: () => void,
    onSuccess?: () => void,
  ) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await operation();
      if (result.status === "success") {
        onSuccess?.();
        router.refresh();
      } else {
        setMessage(errorMessage(result, "Option"));
        focusOnFailure?.();
      }
    });
  }

  return (
    <section
      data-modal-section
      aria-busy={pending}
      aria-labelledby="select-options-heading"
      className="space-y-4"
    >
      <div className="space-y-1">
        <h3
          data-form-heading="section"
          className="font-semibold"
          id="select-options-heading"
        >
          Select options
        </h3>
        <p className="text-foreground-muted text-sm">
          Renaming preserves Item membership. Order controls the Item dropdown
          and Browse folders.
        </p>
      </div>
      {pending ? (
        <p className="text-foreground-muted text-sm" role="status">
          Updating options…
        </p>
      ) : null}
      <ul className="space-y-2">
        {field.options.map((option, index) => (
          <li
            className="border-border rounded-control grid min-w-0 gap-2 border p-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            key={option.id}
          >
            <Input
              aria-label={`Option label: ${option.label}`}
              maxLength={DATABASE_LIMITS.selectOptionLabel}
              onChange={(event) =>
                setLabels((current) => ({
                  ...current,
                  [option.id]: event.target.value,
                }))
              }
              ref={(input) => {
                optionRefs.current[option.id] = input;
              }}
              value={labels[option.id] ?? option.label}
            />
            <div className="flex flex-wrap items-center justify-end gap-1">
              <Button
                aria-label={`Save ${option.label}`}
                disabled={pending || !(labels[option.id] ?? "").trim()}
                onClick={() =>
                  runOption(
                    () =>
                      actions.updateOption({
                        collectionId,
                        fieldId: field.id,
                        label: labels[option.id] ?? option.label,
                        optionId: option.id,
                      }),
                    () => optionRefs.current[option.id]?.focus(),
                  )
                }
                type="button"
                variant="outline"
              >
                Save
              </Button>
              <ReorderButtons
                disabled={pending}
                label={option.label}
                onDown={
                  index < field.options.length - 1
                    ? () =>
                        runOption(() =>
                          actions.reorderOptions({
                            collectionId,
                            fieldId: field.id,
                            optionIds: move(field.options, index, 1).map(
                              (entry) => entry.id,
                            ),
                          }),
                        )
                    : undefined
                }
                onUp={
                  index > 0
                    ? () =>
                        runOption(() =>
                          actions.reorderOptions({
                            collectionId,
                            fieldId: field.id,
                            optionIds: move(field.options, index, -1).map(
                              (entry) => entry.id,
                            ),
                          }),
                        )
                    : undefined
                }
              />
              <DeleteOptionDialog
                actions={actions}
                collectionId={collectionId}
                fieldId={field.id}
                option={option}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <label
            className="text-label block"
            htmlFor={`new-option-${field.id}`}
          >
            New option label
          </label>
          <Input
            disabled={atLimit}
            id={`new-option-${field.id}`}
            maxLength={DATABASE_LIMITS.selectOptionLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            ref={newLabelRef}
            value={newLabel}
          />
        </div>
        <Button
          disabled={pending || atLimit || !newLabel.trim()}
          onClick={() => {
            const label = newLabel;
            runOption(
              () =>
                actions.createOption({
                  collectionId,
                  fieldId: field.id,
                  label,
                }),
              () => newLabelRef.current?.focus(),
              () => setNewLabel(""),
            );
          }}
          type="button"
          variant="outline"
        >
          <Plus aria-hidden="true" />
          Add option
        </Button>
      </div>
      {atLimit ? (
        <p className="text-foreground-muted text-sm">
          This Field has the maximum of {DATABASE_LIMITS.selectOptions} options.
        </p>
      ) : null}
      {message ? (
        <p className="text-error" role="alert">
          {message}
        </p>
      ) : null}
    </section>
  );
}

export function EditFieldForm({
  actions,
  collectionId,
  field,
  onSaved,
  onCancel,
  onDeleted = onSaved,
  onPendingChange,
  cancelLabel,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  field: Field;
  onSaved: () => void;
  onCancel: () => void;
  onDeleted?: () => void;
  onPendingChange?: (pending: boolean) => void;
  cancelLabel?: "Back";
}) {
  const router = useRouter();
  const [name, setName] = useState(field.name);
  const [required, setRequired] = useState(field.required);
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [optionPending, setOptionPending] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const busy = pending || optionPending;

  function handleSave() {
    setMessage(undefined);
    startTransition(async () => {
      const result = await actions.updateField({
        collectionId,
        fieldId: field.id,
        name,
        required,
      });
      if (result.status === "success") {
        onSaved();
        router.refresh();
      } else setMessage(errorMessage(result, "Field"));
    });
  }

  useEffect(() => {
    if (message) nameRef.current?.focus();
  }, [message]);

  useFlowBusy(busy);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);
  useEffect(() => {
    onPendingChange?.(busy);
  }, [busy, onPendingChange]);
  return (
    <>
      <p className="text-foreground-muted">
        Rename this Field, change whether it is required, and manage Select
        options without changing stable IDs.
      </p>
      <div className="mt-5 space-y-5">
        <div className="space-y-2">
          <label
            className="text-label block"
            htmlFor={`field-name-${field.id}`}
          >
            Field name
          </label>
          <Input
            id={`field-name-${field.id}`}
            maxLength={DATABASE_LIMITS.fieldName}
            onChange={(event) => setName(event.target.value)}
            ref={nameRef}
            value={name}
          />
        </div>
        <dl className="border-border bg-surface-muted rounded-control flex items-center justify-between gap-4 border px-3 py-2">
          <dt className="text-foreground-muted text-sm">Field type</dt>
          <dd className="font-semibold">
            <FieldTypeLabel type={field.type} />
          </dd>
        </dl>
        <RequiredControl required={required} setRequired={setRequired} />
        {field.type === "select" ? (
          <OptionEditor
            actions={actions}
            collectionId={collectionId}
            field={field}
            onPendingChange={setOptionPending}
          />
        ) : null}
        {message ? (
          <p className="text-error" role="alert">
            {message}
          </p>
        ) : null}
      </div>
      <section
        data-modal-section
        aria-labelledby={`delete-field-heading-${field.id}`}
        className="mt-6 space-y-3"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h2
              data-form-heading="section"
              id={`delete-field-heading-${field.id}`}
            >
              Delete field
            </h2>
            <p className="text-foreground-muted">
              Permanently delete this Field and its values from every Item. This
              cannot be undone.
            </p>
          </div>
          <DeleteFieldDialog
            actions={actions}
            collectionId={collectionId}
            field={field}
            disabled={busy}
            onDeleted={onDeleted}
          />
        </div>
      </section>
      <ModalActions className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {cancelLabel === "Back" ? (
          <Button
            disabled={busy}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
        ) : null}
        <Button
          aria-busy={pending}
          disabled={busy || !name.trim()}
          onClick={handleSave}
          type="button"
        >
          {pending ? "Saving…" : "Save field"}
        </Button>
      </ModalActions>
    </>
  );
}

export function EditFieldDialog({
  actions,
  collectionId,
  field,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  field: Field;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  function changeOpen(next: boolean) {
    if (!busy) setOpen(next);
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Edit ${field.name}`}
          type="button"
          variant="outline"
        >
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent
        className={editorClassName}
        closeDisabled={busy}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle
            data-form-heading="primary"
            className="text-section-title-mobile"
          >
            Edit {field.name}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription className="sr-only">
            Edit this Field and manage its options.
          </DialogDescription>
          <EditFieldForm
            actions={actions}
            collectionId={collectionId}
            field={field}
            onCancel={() => changeOpen(false)}
            onSaved={() => {
              setBusy(false);
              setOpen(false);
            }}
            onPendingChange={setBusy}
          />
        </DialogBody>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

export function AddFieldDialog({
  actions,
  collectionId,
  disabled,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  function changeOpen(next: boolean) {
    if (!pending) setOpen(next);
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} type="button">
          <Plus aria-hidden="true" />
          Add field
        </Button>
      </DialogTrigger>
      <DialogContent
        className={editorClassName}
        closeDisabled={pending}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle
            data-form-heading="primary"
            className="text-section-title-mobile"
          >
            Add custom field
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription className="sr-only">
            Create a custom field for this Collection.
          </DialogDescription>
          <AddFieldForm
            actions={actions}
            collectionId={collectionId}
            onCancel={() => changeOpen(false)}
            onCreated={() => {
              setPending(false);
              setOpen(false);
            }}
            onPendingChange={setPending}
          />
        </DialogBody>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
