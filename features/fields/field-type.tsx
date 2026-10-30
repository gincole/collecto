"use client";
import {
  CalendarDays,
  Hash,
  Link2,
  List,
  Star,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Select } from "@/components/ui/form-control";
import { fieldTypeLabels, type FieldType } from "./field-manager-contract";
import { fieldTypeSchema } from "./schemas";

const icons = {
  date: CalendarDays,
  number: Hash,
  rating: Star,
  select: List,
  text: Type,
  url: Link2,
} satisfies Record<FieldType, LucideIcon>;

export function FieldTypeIcon({ type }: { type: FieldType }) {
  const Icon = icons[type];
  return (
    <Icon
      aria-hidden="true"
      data-field-type-icon={type}
      className="size-4 shrink-0"
    />
  );
}

export function FieldTypeLabel({
  type,
  optionCount,
}: {
  type: FieldType;
  optionCount?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <FieldTypeIcon type={type} />
      {fieldTypeLabels[type]}
      {type === "select" && optionCount !== undefined
        ? ` (${optionCount})`
        : ""}
    </span>
  );
}

function optionIcon(value: string) {
  const parsed = fieldTypeSchema.safeParse(value);
  return parsed.success ? <FieldTypeIcon type={parsed.data} /> : null;
}

export function FieldTypeSelect(
  props: Omit<ComponentProps<typeof Select>, "children" | "optionIcon">,
) {
  return (
    <Select {...props} optionIcon={optionIcon}>
      {fieldTypeSchema.options.map((type) => (
        <option key={type} value={type}>
          {fieldTypeLabels[type]}
        </option>
      ))}
    </Select>
  );
}
