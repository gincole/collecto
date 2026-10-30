"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export const sortableRowClassName =
  "border-border bg-surface rounded-control grid min-w-0 gap-3 border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center";

export function useSortableSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

export function SortableDragOverlay({
  children,
  reducedMotion,
}: {
  children: ReactNode;
  reducedMotion: boolean;
}) {
  return typeof document === "undefined"
    ? null
    : createPortal(
        <DragOverlay
          dropAnimation={reducedMotion ? null : undefined}
          transition={reducedMotion ? "none" : undefined}
        >
          {children}
        </DragOverlay>,
        document.body,
      );
}
