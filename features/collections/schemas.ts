import { z } from "zod";

import { DATABASE_LIMITS } from "@/lib/validation/limits";

export const COLLECTION_PRESET_KEYS = [
  "book",
  "movie",
  "song",
  "merch",
  "shopping",
  "meal",
  "travel",
  "favorites",
  "blank",
] as const;

export const collectionPresetKeySchema = z.enum(COLLECTION_PRESET_KEYS);
export type CollectionPresetKey = z.infer<typeof collectionPresetKeySchema>;

const trimmedRequired = (maximum: number, message: string) =>
  z.string().trim().min(1, message).max(maximum);

const descriptionSchema = z
  .string()
  .trim()
  .max(DATABASE_LIMITS.collectionDescription)
  .transform((value) => value || null)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const collectionIdSchema = z.uuid();

export const collectionCreateSchema = z.object({
  description: descriptionSchema,
  name: trimmedRequired(
    DATABASE_LIMITS.collectionName,
    "Enter a Collection name.",
  ),
  presetKey: collectionPresetKeySchema,
  requestId: collectionIdSchema,
});

export const collectionUpdateSchema = z
  .object({
    collectionId: collectionIdSchema,
    description: descriptionSchema.optional(),
    name: trimmedRequired(
      DATABASE_LIMITS.collectionName,
      "Enter a Collection name.",
    ).optional(),
  })
  .refine(
    ({ description, name }) => description !== undefined || name !== undefined,
    {
      message: "Provide at least one Collection change.",
    },
  );

export const collectionDeleteSchema = z.object({
  collectionId: collectionIdSchema,
  confirmationName: z.string().max(DATABASE_LIMITS.collectionName),
});

export const galleryConfigSchema = z.object({
  aspectRatio: z.enum(["1:1", "2:3", "3:4", "4:3", "16:9"]),
  columns: z.number().int().min(1).max(5),
  imageFit: z.enum(["cover", "contain"]),
  showDetails: z.boolean(),
  sortBy: z.enum(["createdAt", "title"]),
  sortDirection: z.enum(["asc", "desc"]),
  spacing: z.enum(["tight", "normal"]),
  visibleFieldIds: z
    .array(z.union([z.literal("title"), z.literal("description"), z.uuid()]))
    .max(3)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Fields must be unique.",
    ),
});

export type CollectionCreateInput = z.input<typeof collectionCreateSchema>;
export type CollectionCreateData = z.output<typeof collectionCreateSchema>;
export type CollectionUpdateInput = z.input<typeof collectionUpdateSchema>;
export type CollectionUpdateData = z.output<typeof collectionUpdateSchema>;
export type CollectionDeleteInput = z.input<typeof collectionDeleteSchema>;
export type CollectionDeleteData = z.output<typeof collectionDeleteSchema>;
export type GalleryConfig = z.infer<typeof galleryConfigSchema>;
