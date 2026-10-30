"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  MeasuringStrategy,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import {
  sortableRowClassName,
  SortableDragOverlay,
  useSortableSensors,
} from "@/components/ui/sortable-feedback";
import { useFlowBusy } from "@/components/shared/flow-modal";
import { Button } from "@/components/ui/button";
import { ReorderButtons } from "@/features/fields/reorder-buttons";
import { useReducedMotion } from "@/lib/design/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

type Field = { id: string; name: string };
const rowClass = sortableRowClassName;

function FieldRow({
  field,
  visible,
  disabled,
  onTransfer,
  onUp,
  onDown,
}: {
  field: Field;
  visible: boolean;
  disabled: boolean;
  onTransfer: (visible: boolean) => void;
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
      data-field-id={field.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(rowClass, isDragging && "opacity-30")}
    >
      <div className="flex min-w-0 items-center gap-2">
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
          data-field-drag={field.id}
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
          onKeyDown={(event) => {
            if (event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) {
              event.preventDefault();
              if (!disabled) onTransfer(event.key === "ArrowUp");
            } else listeners?.onKeyDown?.(event);
          }}
        >
          <GripVertical aria-hidden="true" />
        </Button>
        <span className="min-w-0 flex-1 truncate">{field.name}</span>
      </div>
      {visible ? (
        <div
          data-field-actions
          className="flex min-w-0 shrink-0 items-center justify-end gap-1"
        >
          <ReorderButtons
            label={field.name}
            disabled={disabled}
            onUp={onUp}
            onDown={onDown}
          />
        </div>
      ) : null}
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
      <h4 className="flex items-center gap-2 text-sm font-medium">
        {name === "Visible" ? (
          <Eye aria-hidden="true" className="size-4" />
        ) : (
          <EyeOff aria-hidden="true" className="size-4" />
        )}
        {name}
      </h4>
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
  useFlowBusy(activeId !== null);
  const [message, setMessage] = useState("");
  const restoreFocus = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focusId = restoreFocus.current;
    if (!focusId) return;
    const handle = Array.from(
      containerRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-field-drag]",
      ) ?? [],
    ).find((button) => button.dataset.fieldDrag === focusId);
    handle?.focus();
    restoreFocus.current = null;
  }, [value]);
  const reduced = useReducedMotion();
  const hidden = fields
    .filter((field) => !value.includes(field.id))
    .map((field) => field.id);
  const active = fields.find((field) => field.id === activeId);
  const sensors = useSortableSensors();
  function transfer(id: string, targetVisible: boolean) {
    if (disabled || value.includes(id) === targetVisible) return;
    restoreFocus.current = !targetVisible || value.length < 3 ? id : null;
    update(id, targetVisible);
  }
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
    <div ref={containerRef} className="space-y-4">
      <DndContext
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press Space or Enter to pick up a field, arrow keys to move, and Space or Enter to drop. Escape cancels. Without picking up, Alt+Up moves to Visible and Alt+Down moves to Hidden.",
          },
        }}
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
                onTransfer={(visible) => transfer(id, visible)}
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
        <FieldList name="Hidden" ids={hidden} disabled={disabled}>
          {fields
            .filter((field) => hidden.includes(field.id))
            .map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                visible={false}
                disabled={disabled}
                onTransfer={(visible) => transfer(field.id, visible)}
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
        <SortableDragOverlay reducedMotion={reduced}>
          {active ? (
            <div
              aria-hidden="true"
              inert
              data-gallery-field-drag-preview
              className={cn(rowClass, "shadow-dialog cursor-grabbing")}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Button disabled size="icon" variant="ghost">
                  <GripVertical aria-hidden="true" />
                </Button>
                <span className="min-w-0 truncate">{active.name}</span>
              </div>
              {value.includes(active.id) ? (
                <div data-field-actions className="flex justify-end">
                  <ReorderButtons disabled label={active.name} />
                </div>
              ) : null}
            </div>
          ) : null}
        </SortableDragOverlay>
      </DndContext>
    </div>
  );
}
