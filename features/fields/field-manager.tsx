"use client";

import { GripVertical, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useFeedback } from "@/components/shared/feedback";
import { fieldActionsWithFeedback } from "./feedback-actions";

import type { CollectionRecord } from "@/features/collections/models";
import { cn } from "@/lib/utils/cn";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

import { DeleteFieldDialog } from "./field-delete-dialogs";
import { AddFieldDialog, EditFieldDialog } from "./field-editors";
import {
  errorMessage,
  fieldTypeLabels,
  move,
  type FieldManagerActions,
} from "./field-manager-contract";
import { ReorderButtons } from "./reorder-buttons";

function BuiltInFields() {
  return (
    <section
      aria-label="Built-in fields"
      className="border-border bg-surface rounded-card sm:p-panel border p-4"
    >
      <div className="mb-4 space-y-1">
        <h2 className="text-section-title-mobile sm:text-section-title">
          Built-in fields
        </h2>
        <p className="text-foreground-muted">
          Every Item includes these properties. They cannot be reordered or
          deleted.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {[
          ["Title", "Required"],
          ["Description", "Optional"],
        ].map(([name, detail]) => (
          <li
            className="border-border bg-surface-muted rounded-control flex min-w-0 items-center gap-3 border p-3"
            key={name}
          >
            <LockKeyhole aria-hidden="true" className="shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">{name}</p>
              <p className="text-foreground-muted text-sm">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FieldManager({
  actions: rawActions,
  collectionId,
  fields,
}: {
  actions: FieldManagerActions;
  collectionId: string;
  fields: CollectionRecord["fields"];
}) {
  const router = useRouter();
  const notify = useFeedback();
  const actions = useMemo(
    () => fieldActionsWithFeedback(rawActions, notify),
    [rawActions, notify],
  );
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const atLimit = fields.length >= DATABASE_LIMITS.collectionFields;

  function reorder(index: number, direction: -1 | 1) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await actions.reorderFields({
        collectionId,
        fieldIds: move(fields, index, direction).map((field) => field.id),
      });
      if (result.status === "success") router.refresh();
      else setMessage(errorMessage(result, "Field order"));
    });
  }

  return (
    <div className="space-y-8">
      <BuiltInFields />
      <section
        aria-label="Custom fields"
        aria-busy={pending}
        className="border-border bg-surface rounded-card sm:p-panel border p-4"
      >
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-section-title-mobile sm:text-section-title">
              Custom fields
            </h2>
            <p className="text-foreground-muted">
              Field order controls Add Item, Edit Item, and Item Details.
            </p>
          </div>
          <AddFieldDialog
            actions={actions}
            collectionId={collectionId}
            disabled={atLimit}
          />
        </div>
        {pending ? (
          <p className="text-foreground-muted mb-4 text-sm" role="status">
            Updating field order…
          </p>
        ) : null}
        {atLimit ? (
          <p className="text-foreground-muted mb-4 text-sm">
            This Collection has the maximum of{" "}
            {DATABASE_LIMITS.collectionFields} custom Fields.
          </p>
        ) : null}
        {fields.length === 0 ? (
          <div className="border-border bg-surface-muted rounded-control border border-dashed p-5 text-center">
            <p className="font-semibold">No custom fields yet</p>
            <p className="text-foreground-muted mt-1 text-sm">
              Add a Field when your Items need more structure.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {fields.map((field, index) => (
              <li
                className={cn(
                  "border-border rounded-control grid min-w-0 gap-3 border p-3",
                  "sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
                )}
                key={field.id}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <GripVertical
                    aria-hidden="true"
                    className="text-foreground-muted mt-0.5 hidden shrink-0 sm:block"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{field.name}</p>
                    <p className="text-foreground-muted text-sm">
                      {fieldTypeLabels[field.type]}
                      {field.type === "select"
                        ? ` · ${field.options.length} ${field.options.length === 1 ? "option" : "options"}`
                        : ""}
                    </p>
                    {field.required ? (
                      <span className="bg-surface-muted border-border rounded-badge mt-2 inline-flex border px-2 py-0.5 text-xs font-semibold">
                        Required
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <ReorderButtons
                    disabled={pending}
                    label={field.name}
                    onDown={
                      index < fields.length - 1
                        ? () => reorder(index, 1)
                        : undefined
                    }
                    onUp={index > 0 ? () => reorder(index, -1) : undefined}
                  />
                  <EditFieldDialog
                    actions={actions}
                    collectionId={collectionId}
                    field={field}
                  />
                  <DeleteFieldDialog
                    actions={actions}
                    collectionId={collectionId}
                    field={field}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
        {message ? (
          <p className="text-error mt-4" role="alert">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export { FieldManager };
export type { FieldManagerActions } from "./field-manager-contract";
