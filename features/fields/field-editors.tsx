"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/form-control";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

import { DeleteOptionDialog } from "./field-delete-dialogs";
import {
  editorClassName,
  errorMessage,
  fieldTypeLabels,
  move,
  type ActionResult,
  type Field,
  type FieldManagerActions,
  type FieldType,
} from "./field-manager-contract";
import { ReorderButtons } from "./reorder-buttons";

function RequiredControl({
  disabled,
  required,
  setRequired,
}: {
  disabled?: boolean;
  required: boolean;
  setRequired: (required: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="flex min-h-11 items-center gap-3 font-semibold">
        <input
          checked={required}
          className="accent-selection-border size-5"
          disabled={disabled}
          onChange={(event) => setRequired(event.target.checked)}
          type="checkbox"
        />
        Required field
      </label>
      <p className="text-foreground-muted text-sm">
        Existing Items may remain empty. The Field is required the next time an
        Item is saved.
      </p>
    </div>
  );
}

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
    <section aria-labelledby="select-options-heading" className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold" id="select-options-heading">
          Select options
        </h3>
        <p className="text-foreground-muted text-sm">
          Renaming preserves Item membership. Order controls the Item dropdown
          and Browse folders.
        </p>
      </div>
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
                size="sm"
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
          <label className="font-semibold" htmlFor={`new-option-${field.id}`}>
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

export function EditFieldDialog({
  actions,
  collectionId,
  field,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  field: Field;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(field.name);
  const [required, setRequired] = useState(field.required);
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [optionPending, setOptionPending] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const busy = pending || optionPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && busy) return;
    setOpen(nextOpen);
  }

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
        setOpen(false);
        router.refresh();
      } else setMessage(errorMessage(result, "Field"));
    });
  }

  useEffect(() => {
    if (message) nameRef.current?.focus();
  }, [message]);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Edit {field.name}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={editorClassName}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        showCloseButton={!busy}
      >
        <div className="space-y-1 pr-10">
          <DialogTitle className="text-section-title">
            Edit {field.name}
          </DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Rename this Field, change whether it is required, and manage Select
            options without changing stable IDs.
          </DialogDescription>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="font-semibold" htmlFor={`field-name-${field.id}`}>
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
            <dd className="font-semibold">{fieldTypeLabels[field.type]}</dd>
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
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button disabled={busy} type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            aria-busy={pending}
            disabled={busy || !name.trim()}
            onClick={handleSave}
            type="button"
          >
            {pending ? "Saving…" : "Save field"}
          </Button>
        </div>
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [required, setRequired] = useState(false);
  const [type, setType] = useState<FieldType>("text");
  const [options, setOptions] = useState<string[]>([]);
  const [createdFieldId, setCreatedFieldId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  function reset() {
    setName("");
    setRequired(false);
    setType("text");
    setOptions([]);
    setCreatedFieldId(undefined);
    setMessage(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && pending) return;
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function handleTypeChange(nextType: FieldType) {
    setType(nextType);
    if (nextType === "select" && options.length === 0) setOptions([""]);
    if (nextType !== "select") setOptions([]);
  }

  function optionLabels() {
    return options.map((label) => label.trim()).filter(Boolean);
  }

  function labelsAreUnique(labels: string[]) {
    return (
      new Set(labels.map((label) => label.toLocaleLowerCase())).size ===
      labels.length
    );
  }

  async function saveOptions(fieldId: string, labels: string[]) {
    for (let index = 0; index < labels.length; index += 1) {
      const result = await actions.createOption({
        collectionId,
        fieldId,
        label: labels[index],
      });
      if (result.status !== "success") {
        setCreatedFieldId(fieldId);
        setOptions(labels.slice(index));
        setMessage(
          "The Field was created. Finish the remaining options without creating it again.",
        );
        router.refresh();
        return false;
      }
    }
    return true;
  }

  function handleCreate() {
    const labels = optionLabels();
    if (type === "select" && !labelsAreUnique(labels)) {
      setMessage("Option labels must be unique.");
      return;
    }
    setMessage(undefined);
    startTransition(async () => {
      let fieldId = createdFieldId;
      if (!fieldId) {
        const result = await actions.createField({
          collectionId,
          name,
          required,
          type,
        });
        fieldId = result.data?.id;
        if (result.status !== "success" || !fieldId) {
          setMessage(errorMessage(result, "Field"));
          nameRef.current?.focus();
          return;
        }
      }
      if (!(await saveOptions(fieldId, labels))) return;
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} type="button">
          <Plus aria-hidden="true" />
          Add field
        </Button>
      </DialogTrigger>
      <DialogContent
        className={editorClassName}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
        showCloseButton={!pending}
      >
        <div className="space-y-1 pr-10">
          <DialogTitle className="text-section-title">
            Add custom field
          </DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Choose a permanent type. The name, required state, order, and Select
            options can be changed later.
          </DialogDescription>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="font-semibold" htmlFor="new-field-name">
              Field name
            </label>
            <Input
              disabled={Boolean(createdFieldId)}
              id="new-field-name"
              maxLength={DATABASE_LIMITS.fieldName}
              onChange={(event) => setName(event.target.value)}
              ref={nameRef}
              value={name}
            />
          </div>
          <div className="space-y-2">
            <label className="font-semibold" htmlFor="new-field-type">
              Field type
            </label>
            <Select
              disabled={Boolean(createdFieldId)}
              id="new-field-type"
              onChange={(event) =>
                handleTypeChange(event.target.value as FieldType)
              }
              value={type}
            >
              {Object.entries(fieldTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <p className="text-foreground-muted text-sm">
              Field type cannot be changed after creation.
            </p>
          </div>
          <RequiredControl
            disabled={Boolean(createdFieldId)}
            required={required}
            setRequired={setRequired}
          />
          {type === "select" ? (
            <section
              aria-labelledby="initial-options-heading"
              className="space-y-3"
            >
              <div className="space-y-1">
                <h3 className="font-semibold" id="initial-options-heading">
                  {createdFieldId ? "Remaining options" : "Initial options"}
                </h3>
                <p className="text-foreground-muted text-sm">
                  Empty option rows are ignored. Labels must be unique.
                </p>
              </div>
              {options.map((label, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <Input
                    aria-label={`Option ${index + 1}`}
                    maxLength={DATABASE_LIMITS.selectOptionLabel}
                    onChange={(event) =>
                      setOptions((current) =>
                        current.map((entry, optionIndex) =>
                          optionIndex === index ? event.target.value : entry,
                        ),
                      )
                    }
                    value={label}
                  />
                  {options.length > 1 ? (
                    <Button
                      aria-label={`Remove option ${index + 1}`}
                      onClick={() =>
                        setOptions((current) =>
                          current.filter(
                            (_, optionIndex) => optionIndex !== index,
                          ),
                        )
                      }
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button
                disabled={options.length >= DATABASE_LIMITS.selectOptions}
                onClick={() => setOptions((current) => [...current, ""])}
                type="button"
                variant="outline"
              >
                <Plus aria-hidden="true" />
                Add option
              </Button>
            </section>
          ) : null}
          {message ? (
            <p className="text-error" role="alert">
              {message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button disabled={pending} type="button" variant="outline">
              {createdFieldId ? "Close" : "Cancel"}
            </Button>
          </DialogClose>
          <Button
            aria-busy={pending}
            disabled={pending || !name.trim()}
            onClick={handleCreate}
            type="button"
          >
            {pending
              ? "Saving…"
              : createdFieldId
                ? "Finish options"
                : "Create field"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
