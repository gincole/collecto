import type { CollectionRecord } from "@/features/collections/models";
import type { GalleryConfig } from "@/features/collections/schemas";

export function sanitizeVisibleFields(
  config: GalleryConfig,
  fields: CollectionRecord["fields"],
): GalleryConfig {
  const allowed = new Set([
    "title",
    "description",
    ...fields.map(({ id }) => id),
  ]);
  return {
    ...config,
    visibleFieldIds: [...new Set(config.visibleFieldIds)]
      .filter((id) => allowed.has(id))
      .slice(0, 3),
  };
}
