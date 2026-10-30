"use client";

import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { cn } from "@/lib/utils/cn";
import {
  fieldTypeLabels,
  type Field,
  type FieldManagerActions,
} from "./field-manager-contract";
import { EditFieldDialog } from "./field-editors";
import { DeleteFieldDialog } from "./field-delete-dialogs";
import { ReorderButtons } from "./reorder-buttons";

const rowClass =
  "border-border bg-surface rounded-control grid min-w-0 gap-3 border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center";

function FieldRowBody({
  field,
  handle,
  children,
}: {
  field: Field;
  handle: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex min-w-0 items-start gap-2">
        {handle}
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
        {children}
      </div>
    </>
  );
}

export function SortableFieldRow({
  field,
  collectionId,
  actions,
  onUp,
  onDown,
  reducedMotion,
}: {
  field: Field;
  collectionId: string;
  actions: FieldManagerActions;
  onUp?: () => void;
  onDown?: () => void;
  reducedMotion: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    animateLayoutChanges: () => true,
    transition: reducedMotion ? null : undefined,
  });
  return (
    <li
      ref={setNodeRef}
      data-field-id={field.id}
      className={cn(rowClass, isDragging && "opacity-30")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <FieldRowBody
        field={field}
        handle={
          <Button
            {...attributes}
            {...listeners}
            ref={setActivatorNodeRef}
            aria-label={`Drag ${field.name} to reorder`}
            className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
            size="icon"
            type="button"
            variant="ghost"
          >
            <GripVertical aria-hidden="true" />
          </Button>
        }
      >
        <ReorderButtons label={field.name} onDown={onDown} onUp={onUp} />
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
      </FieldRowBody>
    </li>
  );
}

export function FieldDragPreview({ field }: { field: Field }) {
  return (
    <div
      aria-hidden="true"
      inert
      data-field-drag-preview
      className={cn(rowClass, "shadow-dialog cursor-grabbing")}
    >
      <FieldRowBody
        field={field}
        handle={
          <Button disabled size="icon" variant="ghost">
            <GripVertical aria-hidden="true" />
          </Button>
        }
      >
        <ReorderButtons disabled label={field.name} />
        <Button disabled variant="outline">
          Edit {field.name}
        </Button>
        <DeleteButton disabled />
      </FieldRowBody>
    </div>
  );
}
