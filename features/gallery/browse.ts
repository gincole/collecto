import { z } from "zod";
import type { ItemFieldDefinition, ItemRecord } from "@/features/items/types";

// A missing selectedOptionId means the folder overview; this reserved value selects missing values.
export const UNCATEGORIZED = "uncategorized";
export type BrowseState = { fieldId: string | null; optionId: string | null };
const fieldParam = z.uuid().optional();
const optionParam = z.union([z.uuid(), z.literal(UNCATEGORIZED)]).optional();
const querySchema = z.object({
  groupByFieldId: z.unknown().optional(),
  selectedOptionId: z.unknown().optional(),
});

export function resolveBrowseState(
  input: unknown,
  fields: ItemFieldDefinition[],
): BrowseState & { needsRedirect: boolean } {
  const query = querySchema.safeParse(input);
  if (!query.success)
    return { fieldId: null, optionId: null, needsRedirect: true };
  const group = fieldParam.safeParse(query.data.groupByFieldId);
  const field = group.success
    ? fields.find((field) => field.type === "select" && field.id === group.data)
    : undefined;
  if (!field)
    return {
      fieldId: null,
      optionId: null,
      needsRedirect:
        query.data.groupByFieldId !== undefined ||
        query.data.selectedOptionId !== undefined,
    };
  const selected = optionParam.safeParse(query.data.selectedOptionId);
  const optionId =
    selected.success &&
    (selected.data === UNCATEGORIZED ||
      field.options.some((option) => option.id === selected.data))
      ? (selected.data ?? null)
      : null;
  return {
    fieldId: field.id,
    optionId,
    needsRedirect:
      query.data.selectedOptionId !== undefined && optionId === null,
  };
}

export function browseHref(collectionId: string, state: BrowseState) {
  const query = new URLSearchParams();
  if (state.fieldId) {
    query.set("groupByFieldId", state.fieldId);
    if (state.optionId) query.set("selectedOptionId", state.optionId);
  }
  return `/collections/${collectionId}${query.size ? `?${query}` : ""}`;
}

export function itemFolderId(item: ItemRecord, field: ItemFieldDefinition) {
  const value = item.values[field.id];
  return field.options.some((option) => option.id === value) &&
    typeof value === "string"
    ? value
    : UNCATEGORIZED;
}

export function getBrowseFolders(
  field: ItemFieldDefinition,
  items: ItemRecord[],
) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const id = itemFolderId(item, field);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [
    ...[...field.options]
      .sort((left, right) => left.position - right.position)
      .map((option) => ({
        id: option.id,
        label: option.label,
        count: counts.get(option.id) ?? 0,
      })),
    {
      id: UNCATEGORIZED,
      label: "Uncategorized",
      count: counts.get(UNCATEGORIZED) ?? 0,
    },
  ];
}
