import { z } from "zod";
import { fieldTypeSchema } from "@/features/fields/schemas";
import { DATABASE_LIMITS } from "@/lib/validation/limits";

export const collectionFieldDraftSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a field name.")
      .max(DATABASE_LIMITS.fieldName),
    type: fieldTypeSchema,
    required: z.boolean(),
    options: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Enter an option label.")
          .max(DATABASE_LIMITS.selectOptionLabel),
      )
      .max(DATABASE_LIMITS.selectOptions),
  })
  .strict()
  .superRefine((field, context) => {
    if (field.type !== "select" && field.options.length)
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Only Select fields can have options.",
      });
    const seen = new Set<string>();
    field.options.forEach((label, index) => {
      const key = label.toLowerCase();
      if (seen.has(key))
        context.addIssue({
          code: "custom",
          path: ["options", index],
          message: "Option labels must be unique.",
        });
      seen.add(key);
    });
  });

export const collectionFieldsDraftSchema = z
  .array(collectionFieldDraftSchema)
  .max(DATABASE_LIMITS.collectionFields)
  .superRefine((fields, context) => {
    const seen = new Set<string>();
    fields.forEach((field, index) => {
      const key = field.name.toLowerCase();
      if (seen.has(key))
        context.addIssue({
          code: "custom",
          path: [index, "name"],
          message: "Field names must be unique.",
        });
      seen.add(key);
    });
  });

export type CollectionFieldDraft = z.infer<typeof collectionFieldDraftSchema>;
