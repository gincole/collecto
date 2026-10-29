import { z } from "zod";

import { collectionPresetKeySchema, galleryConfigSchema } from "./schemas";

const fieldOptionRowSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  position: z.number().int().nonnegative(),
});

const fieldDefinitionRowSchema = z.object({
  field_options: z.array(fieldOptionRowSchema),
  id: z.uuid(),
  name: z.string(),
  position: z.number().int().nonnegative(),
  required: z.boolean(),
  type: z.enum(["text", "number", "date", "rating", "select", "url"]),
});

const collectionRowSchema = z.object({
  created_at: z.string(),
  description: z.string().nullable(),
  field_definitions: z.array(fieldDefinitionRowSchema),
  id: z.uuid(),
  items: z.array(
    z.union([
      z.object({ count: z.number().int().nonnegative() }),
      z.object({ id: z.uuid(), image_path: z.string().nullable() }),
    ]),
  ),
  name: z.string(),
  preset_key: collectionPresetKeySchema.nullable(),
  updated_at: z.string(),
  view_config: galleryConfigSchema,
});

export type CollectionRecord = ReturnType<typeof mapCollectionRecord>;

export function mapCollectionRecord(input: unknown) {
  const row = collectionRowSchema.parse(input);
  const aggregate = row.items.find(
    (item): item is { count: number } => "count" in item,
  );
  const itemRows = row.items.filter(
    (item): item is { id: string; image_path: string | null } => "id" in item,
  );

  return {
    createdAt: row.created_at,
    description: row.description,
    fields: row.field_definitions
      .map((field) => ({
        id: field.id,
        name: field.name,
        options: field.field_options
          .map((option) => ({ ...option }))
          .sort((left, right) => left.position - right.position),
        position: field.position,
        required: field.required,
        type: field.type,
      }))
      .sort((left, right) => left.position - right.position),
    id: row.id,
    imageCount: itemRows.filter((item) => item.image_path !== null).length,
    itemCount: aggregate?.count ?? itemRows.length,
    name: row.name,
    presetKey: row.preset_key,
    updatedAt: row.updated_at,
    viewConfig: row.view_config,
  };
}
