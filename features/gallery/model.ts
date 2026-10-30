import type { GalleryConfig } from "@/features/collections/schemas";
import type { ItemFieldDefinition, ItemRecord } from "@/features/items/types";

export function getGalleryDisplayValues(
  item: ItemRecord,
  fields: ItemFieldDefinition[],
  visibleFieldIds: GalleryConfig["visibleFieldIds"],
  locale?: string,
) {
  return visibleFieldIds.flatMap<string>((fieldId) => {
    if (fieldId === "title") return item.title ? [item.title] : [];
    if (fieldId === "description")
      return item.description ? [item.description] : [];

    const field = fields.find((candidate) => candidate.id === fieldId);
    const value = item.values[fieldId];
    if (!field || value === undefined || value === "") return [];

    if (field.type === "select") {
      const option = field.options.find((candidate) => candidate.id === value);
      return option ? [option.label] : [];
    }
    if (field.type === "rating")
      return typeof value === "number" && value >= 1 && value <= 5
        ? [`${value} out of 5`]
        : [];
    if (field.type === "number")
      return typeof value === "number"
        ? [new Intl.NumberFormat(locale).format(value)]
        : [];
    if (field.type === "date")
      return typeof value === "string"
        ? [
            new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeZone: "UTC",
            }).format(new Date(`${value}T00:00:00Z`)),
          ]
        : [];
    return [String(value)];
  });
}

export function sortGalleryItems(
  items: ItemRecord[],
  sortBy: GalleryConfig["sortBy"],
  sortDirection: GalleryConfig["sortDirection"],
  locale?: string,
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...items].sort((left, right) => {
    if (sortBy === "title") {
      const titleOrder = left.title.localeCompare(right.title, locale, {
        sensitivity: "base",
      });
      if (titleOrder !== 0) return titleOrder * direction;
    } else {
      const createdOrder = left.createdAt.localeCompare(right.createdAt);
      if (createdOrder !== 0) return createdOrder * direction;
    }

    const createdOrder = left.createdAt.localeCompare(right.createdAt);
    if (createdOrder !== 0) return createdOrder;
    return left.id.localeCompare(right.id);
  });
}
