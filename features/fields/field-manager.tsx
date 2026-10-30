"use client";

import { LockKeyhole, Plus } from "lucide-react";
import { useMemo, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableFieldRow, FieldDragPreview } from "./sortable-field-row";
import { useFieldOrder } from "./use-field-order";
import { useReducedMotion } from "@/lib/design/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { useFlowBusy } from "@/components/shared/flow-modal";
import { useFeedback } from "@/components/shared/feedback";
import { fieldActionsWithFeedback } from "./feedback-actions";

import type { CollectionRecord } from "@/features/collections/models";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

import { AddFieldDialog } from "./field-editors";
import { move, type FieldManagerActions } from "./field-manager-contract";

function BuiltInFields() {
  return (
    <section
      data-form-panel
      aria-label="Built-in fields"
      className="border-border bg-surface rounded-card sm:p-panel border p-4"
    >
      <div className="mb-4 space-y-1">
        <h2
          data-form-heading="section"
          className="text-section-title-mobile sm:text-section-title"
        >
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
  fields: serverFields,
  onAddField,
  addFieldTriggerRef,
}: {
  onAddField?: () => void;
  addFieldTriggerRef?: RefObject<HTMLButtonElement | null>;
  actions: FieldManagerActions;
  collectionId: string;
  fields: CollectionRecord["fields"];
}) {
  const notify = useFeedback();
  const actions = useMemo(
    () => fieldActionsWithFeedback(rawActions, notify),
    [rawActions, notify],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const {
    fields,
    saving: pending,
    message,
    saveOrder,
  } = useFieldOrder(serverFields, collectionId, rawActions, activeId !== null);
  useFlowBusy(pending || activeId !== null);
  const atLimit = fields.length >= DATABASE_LIMITS.collectionFields;
  const activeField = fields.find((field) => field.id === activeId);
  const fieldName = (id: UniqueIdentifier) =>
    fields.find((field) => field.id === id)?.name ?? "Field";
  const position = (id: UniqueIdentifier) =>
    fields.findIndex((field) => field.id === id) + 1;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <div className="space-y-8">
      <BuiltInFields />
      <section
        data-form-panel
        aria-label="Custom fields"
        className="border-border bg-surface rounded-card sm:p-panel border p-4"
      >
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2
              data-form-heading="section"
              className="text-section-title-mobile sm:text-section-title"
            >
              Custom fields
            </h2>
            <p className="text-foreground-muted">
              Field order controls Add Item, Edit Item, and Item Details.
            </p>
          </div>
          {onAddField ? (
            <Button
              disabled={atLimit || pending}
              onClick={onAddField}
              ref={addFieldTriggerRef}
              type="button"
            >
              <Plus aria-hidden="true" />
              Add field
            </Button>
          ) : (
            <AddFieldDialog
              actions={actions}
              collectionId={collectionId}
              disabled={atLimit}
            />
          )}
        </div>
        {pending ? (
          <p className="sr-only" role="status">
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
          <DndContext
            accessibility={{
              screenReaderInstructions: {
                draggable:
                  "Press Space or Enter to pick up a field, arrow keys to move, Space or Enter to drop, and Escape to cancel.",
              },
              announcements: {
                onDragStart: ({ active }) =>
                  `Picked up ${fieldName(active.id)}.`,
                onDragOver: ({ active, over }) =>
                  over
                    ? `${fieldName(active.id)} moving to position ${position(over.id)} of ${fields.length}.`
                    : "Outside the field list. Drop to cancel.",
                onDragEnd: ({ active, over }) =>
                  over
                    ? `${fieldName(active.id)} dropped at position ${position(over.id)} of ${fields.length}.`
                    : `${fieldName(active.id)} movement cancelled.`,
                onDragCancel: ({ active }) =>
                  `${fieldName(active.id)} movement cancelled.`,
              },
            }}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveId(String(active.id))}
            onDragCancel={() => setActiveId(null)}
            onDragEnd={({ active, over }) => {
              setActiveId(null);
              if (!over || active.id === over.id) return;
              const from = fields.findIndex((field) => field.id === active.id),
                to = fields.findIndex((field) => field.id === over.id);
              if (from >= 0 && to >= 0) saveOrder(arrayMove(fields, from, to));
            }}
          >
            <SortableContext
              items={fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-3">
                {fields.map((field, index) => (
                  <SortableFieldRow
                    reducedMotion={reducedMotion}
                    key={field.id}
                    field={field}
                    actions={actions}
                    collectionId={collectionId}
                    onUp={
                      index > 0
                        ? () => saveOrder(move(fields, index, -1))
                        : undefined
                    }
                    onDown={
                      index < fields.length - 1
                        ? () => saveOrder(move(fields, index, 1))
                        : undefined
                    }
                  />
                ))}
              </ol>
            </SortableContext>
            {typeof document !== "undefined"
              ? createPortal(
                  <DragOverlay
                    dropAnimation={reducedMotion ? null : undefined}
                    transition={reducedMotion ? "none" : undefined}
                  >
                    {activeField ? (
                      <FieldDragPreview field={activeField} />
                    ) : null}
                  </DragOverlay>,
                  document.body,
                )
              : null}
          </DndContext>
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
