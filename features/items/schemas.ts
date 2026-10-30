import { z } from "zod";
import { DATABASE_LIMITS } from "@/lib/validation/limits";
import type { ItemFieldDefinition, ItemValue } from "./types";

const uuidSchema = z.uuid();
const itemIdInputSchema = z.object({
  collectionId: uuidSchema,
  itemId: uuidSchema,
});
export type ItemMutationData = {
  collectionId: string;
  description: string | null;
  itemId?: string;
  title: string;
  values: Record<string, ItemValue>;
};
export type ItemValidationResult =
  | { data: ItemMutationData; success: true }
  | { fieldErrors: Record<string, string>; formError?: string; success: false };
const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

function validateField(
  field: ItemFieldDefinition,
  raw: unknown,
): { error?: string; value?: ItemValue } {
  const value = text(raw);
  if (!value) return field.required ? { error: `Enter ${field.name}.` } : {};
  if (field.type === "number") {
    const number = Number(value);
    return Number.isFinite(number)
      ? { value: number }
      : { error: `${field.name} must be a number.` };
  }
  if (field.type === "date") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = match
      ? new Date(
          Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
        )
      : null;
    return date &&
      `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}` ===
        value
      ? { value }
      : { error: `${field.name} must be a valid date.` };
  }
  if (field.type === "rating") {
    const rating = Number(value);
    return Number.isInteger(rating) && rating >= 1 && rating <= 5
      ? { value: rating }
      : { error: `${field.name} must be from 1 to 5.` };
  }
  if (field.type === "select")
    return field.options.some((option) => option.id === value)
      ? { value }
      : { error: `Choose a current option for ${field.name}.` };
  if (field.type === "url") {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) &&
        value.length <= DATABASE_LIMITS.url
        ? { value }
        : { error: `${field.name} must be an HTTP or HTTPS URL.` };
    } catch {
      return { error: `${field.name} must be an HTTP or HTTPS URL.` };
    }
  }
  return { value };
}

export function validateItemInput(
  input: unknown,
  fields: ItemFieldDefinition[],
): ItemValidationResult {
  const base = z
    .object({
      collectionId: uuidSchema,
      description: z.unknown().optional(),
      itemId: uuidSchema.optional(),
      title: z.unknown(),
      values: z.record(z.string(), z.unknown()).default({}),
    })
    .safeParse(input);
  if (!base.success)
    return {
      fieldErrors: {},
      formError: "The Item request is invalid.",
      success: false,
    };
  const fieldErrors: Record<string, string> = {};
  const title = text(base.data.title);
  const description = text(base.data.description);
  if (!title) fieldErrors.title = "Enter an Item title.";
  else if (title.length > DATABASE_LIMITS.itemTitle)
    fieldErrors.title = `Keep the title under ${DATABASE_LIMITS.itemTitle} characters.`;
  if (description.length > DATABASE_LIMITS.itemDescription)
    fieldErrors.description = `Keep the description under ${DATABASE_LIMITS.itemDescription} characters.`;
  const known = new Set(fields.map((field) => field.id));
  const hasUnknown = Object.keys(base.data.values).some((id) => !known.has(id));
  const values: Record<string, ItemValue> = {};
  for (const field of [...fields].sort((a, b) => a.position - b.position)) {
    const result = validateField(field, base.data.values[field.id]);
    if (result.error) fieldErrors[`values.${field.id}`] = result.error;
    else if (result.value !== undefined) values[field.id] = result.value;
  }
  if (Object.keys(fieldErrors).length || hasUnknown)
    return {
      fieldErrors,
      formError: hasUnknown
        ? "The Item no longer matches the current Collection schema. Refresh and try again."
        : undefined,
      success: false,
    };
  return {
    data: {
      collectionId: base.data.collectionId,
      description: description || null,
      itemId: base.data.itemId,
      title,
      values,
    },
    success: true,
  };
}
export const parseItemIds = (input: unknown) =>
  itemIdInputSchema.safeParse(input);
