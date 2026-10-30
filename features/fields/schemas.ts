import { z } from "zod";

import { DATABASE_LIMITS } from "@/lib/validation/limits";

export const fieldTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "rating",
  "select",
  "url",
]);
const id = z.uuid();
const name = z
  .string()
  .trim()
  .min(1, "Enter a field name.")
  .max(DATABASE_LIMITS.fieldName);
const label = z
  .string()
  .trim()
  .min(1, "Enter an option label.")
  .max(DATABASE_LIMITS.selectOptionLabel);
const uniqueIds = (maximum: number) =>
  z
    .array(id)
    .max(maximum)
    .refine((ids) => new Set(ids).size === ids.length, "IDs must be unique.");

export const fieldCreateSchema = z
  .object({
    collectionId: id,
    name,
    required: z.boolean(),
    type: fieldTypeSchema,
  })
  .strict();
export const fieldUpdateSchema = z
  .object({
    collectionId: id,
    fieldId: id,
    name: name.optional(),
    required: z.boolean().optional(),
  })
  .strict()
  .refine(
    ({ name, required }) => name !== undefined || required !== undefined,
    {
      message: "Provide at least one field change.",
    },
  );
export const fieldIdentitySchema = z
  .object({ collectionId: id, fieldId: id })
  .strict();
export const fieldReorderSchema = z
  .object({
    collectionId: id,
    fieldIds: uniqueIds(DATABASE_LIMITS.collectionFields),
  })
  .strict();
export const optionCreateSchema = z
  .object({ collectionId: id, fieldId: id, label })
  .strict();
export const optionUpdateSchema = z
  .object({ collectionId: id, fieldId: id, label, optionId: id })
  .strict();
export const optionIdentitySchema = z
  .object({ collectionId: id, fieldId: id, optionId: id })
  .strict();
export const optionReorderSchema = z
  .object({
    collectionId: id,
    fieldId: id,
    optionIds: uniqueIds(DATABASE_LIMITS.selectOptions),
  })
  .strict();

export type FieldCreateData = z.output<typeof fieldCreateSchema>;
export type FieldUpdateData = z.output<typeof fieldUpdateSchema>;
export type FieldIdentityData = z.output<typeof fieldIdentitySchema>;
export type FieldReorderData = z.output<typeof fieldReorderSchema>;
export type OptionCreateData = z.output<typeof optionCreateSchema>;
export type OptionUpdateData = z.output<typeof optionUpdateSchema>;
export type OptionIdentityData = z.output<typeof optionIdentitySchema>;
export type OptionReorderData = z.output<typeof optionReorderSchema>;
