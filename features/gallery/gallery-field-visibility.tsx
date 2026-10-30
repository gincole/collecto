"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReorderButtons } from "@/features/fields/reorder-buttons";
import { useReducedMotion } from "@/lib/design/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

type Field = { id: string; name: string };
const rowClass =
  "border-border rounded-control flex min-w-0 items-center gap-2 border p-2";

function FieldRow({
  field,
  visible,
  disabled,
  onToggle,
  onUp,
  onDown,
}: {
  field: Field;
  visible: boolean;
  disabled: boolean;
  onToggle: () => void;
  onUp?: () => void;
  onDown?: () => void;
}) {
  const reduced = useReducedMotion();
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
    disabled,
    animateLayoutChanges: () => true,
    transition: reduced ? null : undefined,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        rowClass,
        "grid grid-cols-[2.75rem_minmax(0,1fr)] sm:flex",
        isDragging && "opacity-30",
      )}
    >
      <Button
        {...attributes}
        {...listeners}
        ref={setActivatorNodeRef}
        disabled={disabled}
        type="button"
        variant="ghost"
        size="icon"
        className="cursor-grab touch-none active:cursor-grabbing"
        aria-label={`Drag ${field.name} to change visibility or order`}
      >
        <GripVertical aria-hidden="true" />
      </Button>
      <span className="min-w-0 flex-1 truncate">{field.name}</span>
      <div className="col-span-2 flex shrink-0 items-center justify-end gap-1">
        {visible ? (
          <ReorderButtons
            label={field.name}
            disabled={disabled}
            onUp={onUp}
            onDown={onDown}
          />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={onToggle}
          aria-label={`${visible ? "Hide" : "Show"} ${field.name}`}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
    </li>
  );
}

function FieldList({
  name,
  children,
  ids,
  disabled,
}: {
  name: "Visible" | "Hidden";
  children: ReactNode;
  ids: string[];
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `gallery-${name}`,
    disabled,
  });
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{name}</h4>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol
          ref={setNodeRef}
          aria-label={name}
          className={cn(
            "rounded-control min-h-12 space-y-2",
            isOver && "bg-surface-muted",
          )}
        >
          {children}
          {ids.length === 0 ? (
            <li className="text-foreground-muted p-3 text-sm">
              Drag fields here
            </li>
          ) : null}
        </ol>
      </SortableContext>
    </div>
  );
}

export function GalleryFieldVisibility({
  fields,
  value,
  onChange,
  disabled,
}: {
  fields: Field[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const reduced = useReducedMotion();
  const hidden = fields
    .filter((field) => !value.includes(field.id))
    .map((field) => field.id);
  const active = fields.find((field) => field.id === activeId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function update(id: string, targetVisible: boolean, targetId?: string) {
    if (disabled) return;
    setMessage("");
    if (!targetVisible) {
      onChange(value.filter((current) => current !== id));
      return;
    }
    if (value.includes(id)) {
      const to = targetId ? value.indexOf(targetId) : value.length - 1;
      if (to >= 0) onChange(arrayMove(value, value.indexOf(id), to));
    } else if (value.length < 3) {
      const next = [...value];
      const at = targetId ? next.indexOf(targetId) : -1;
      next.splice(at < 0 ? next.length : at, 0, id);
      onChange(next);
    } else setMessage("Choose up to three visible fields. Hide a field first.");
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;
        const target = String(over.id);
        update(
          String(active.id),
          target === "gallery-Visible" || value.includes(target),
          target === "gallery-Visible" ? undefined : target,
        );
      }}
    >
      <FieldList name="Visible" ids={value} disabled={disabled}>
        {value.map((id, index) => {
          const field = fields.find((field) => field.id === id);
          return field ? (
            <FieldRow
              key={id}
              field={field}
              visible
              disabled={disabled}
              onToggle={() => update(id, false)}
              onUp={
                index > 0
                  ? () => onChange(arrayMove(value, index, index - 1))
                  : undefined
              }
              onDown={
                index < value.length - 1
                  ? () => onChange(arrayMove(value, index, index + 1))
                  : undefined
              }
            />
          ) : null;
        })}
      </FieldList>
      <hr className="border-border mx-auto my-5 w-3/4 border-t border-dashed" />
      <FieldList name="Hidden" ids={hidden} disabled={disabled}>
        {fields
          .filter((field) => hidden.includes(field.id))
          .map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              visible={false}
              disabled={disabled}
              onToggle={() => update(field.id, true)}
            />
          ))}
      </FieldList>
      <p
        aria-label="Field visibility"
        role="status"
        className="text-foreground-muted text-sm"
      >
        {message}
      </p>
      <DragOverlay dropAnimation={reduced ? null : undefined}>
        {active ? (
          <div
            aria-hidden="true"
            className={cn(rowClass, "bg-surface shadow-dialog")}
          >
            <GripVertical className="size-4" />
            <span className="truncate">{active.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
