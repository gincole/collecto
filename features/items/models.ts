import { z } from "zod";
const itemRowSchema = z.object({
  collection_id: z.uuid(),
  created_at: z.string(),
  description: z.string().nullable(),
  id: z.uuid(),
  title: z.string(),
  updated_at: z.string(),
  values: z.record(z.string(), z.union([z.string(), z.number()])),
});
export function mapItemRecord(input: unknown) {
  const row = itemRowSchema.parse(input);
  return {
    collectionId: row.collection_id,
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    values: row.values,
  };
}
