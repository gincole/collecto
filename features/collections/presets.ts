import type { Database } from "@/lib/supabase/database.types";

import {
  collectionCreateSchema,
  type CollectionCreateInput,
  type CollectionPresetKey,
  type GalleryConfig,
} from "./schemas";

type FieldType = Database["public"]["Enums"]["field_type"];

export type PresetField = {
  name: string;
  options?: string[];
  type: FieldType;
};

export type CollectionPreset = {
  aspectRatio: GalleryConfig["aspectRatio"];
  fields: PresetField[];
  key: CollectionPresetKey;
  label: string;
};

export type CollectionCreatePayload = {
  description: string | null;
  fields: Array<{
    id: string;
    name: string;
    options: Array<{ id: string; label: string; position: number }>;
    position: number;
    required: boolean;
    type: FieldType;
  }>;
  name: string;
  presetKey: CollectionPresetKey;
  requestId: string;
  viewConfig: GalleryConfig;
};

const PRESETS: Record<CollectionPresetKey, CollectionPreset> = {
  book: {
    aspectRatio: "2:3",
    fields: [
      { name: "Author", type: "text" },
      {
        name: "Genre",
        options: [
          "Fiction",
          "Nonfiction",
          "Fantasy",
          "Mystery",
          "Romance",
          "Sci-Fi",
          "Other",
        ],
        type: "select",
      },
      {
        name: "Status",
        options: ["To Read", "Reading", "Finished"],
        type: "select",
      },
      { name: "Rating", type: "rating" },
    ],
    key: "book",
    label: "Books",
  },
  movie: {
    aspectRatio: "2:3",
    fields: [
      {
        name: "Genre",
        options: [
          "Action",
          "Comedy",
          "Drama",
          "Fantasy",
          "Horror",
          "Romance",
          "Sci-Fi",
          "Other",
        ],
        type: "select",
      },
      {
        name: "Status",
        options: ["To Watch", "Watching", "Watched"],
        type: "select",
      },
      { name: "Watched Date", type: "date" },
      { name: "Rating", type: "rating" },
    ],
    key: "movie",
    label: "Movies",
  },
  song: {
    aspectRatio: "1:1",
    fields: [
      { name: "Artist", type: "text" },
      { name: "Album", type: "text" },
      {
        name: "Genre",
        options: [
          "Pop",
          "Rock",
          "Hip-Hop",
          "Electronic",
          "Jazz",
          "Classical",
          "Other",
        ],
        type: "select",
      },
      { name: "Rating", type: "rating" },
    ],
    key: "song",
    label: "Music",
  },
  merch: {
    aspectRatio: "1:1",
    fields: [
      {
        name: "Category",
        options: ["Apparel", "Accessories", "Home", "Collectibles", "Other"],
        type: "select",
      },
      { name: "Price", type: "number" },
      {
        name: "Status",
        options: ["Wanted", "Ordered", "Owned"],
        type: "select",
      },
      { name: "Source", type: "text" },
    ],
    key: "merch",
    label: "Collectibles",
  },
  shopping: {
    aspectRatio: "1:1",
    fields: [
      { name: "Price", type: "number" },
      { name: "Store", type: "text" },
      {
        name: "Status",
        options: ["Idea", "Planned", "Purchased"],
        type: "select",
      },
      { name: "URL", type: "url" },
    ],
    key: "shopping",
    label: "Shopping",
  },
  meal: {
    aspectRatio: "4:3",
    fields: [
      { name: "Restaurant", type: "text" },
      { name: "Price", type: "number" },
      { name: "Date", type: "date" },
      { name: "Rating", type: "rating" },
    ],
    key: "meal",
    label: "Meals",
  },
  travel: {
    aspectRatio: "4:3",
    fields: [
      { name: "Location", type: "text" },
      { name: "Date", type: "date" },
      { name: "Notes", type: "text" },
      { name: "Rating", type: "rating" },
    ],
    key: "travel",
    label: "Travel",
  },
  favorites: {
    aspectRatio: "1:1",
    fields: [
      {
        name: "Category",
        options: ["Books", "Movies", "Music", "Food", "Places", "Other"],
        type: "select",
      },
      { name: "Notes", type: "text" },
      { name: "Rating", type: "rating" },
    ],
    key: "favorites",
    label: "Favorites",
  },
  blank: { aspectRatio: "3:4", fields: [], key: "blank", label: "Custom" },
};

function copyPreset(preset: CollectionPreset): CollectionPreset {
  return {
    ...preset,
    fields: preset.fields.map((field) => ({
      ...field,
      options: field.options ? [...field.options] : undefined,
    })),
  };
}

export function listCollectionPresets() {
  return Object.values(PRESETS).map(copyPreset);
}

export function getCollectionPreset(key: CollectionPresetKey) {
  return copyPreset(PRESETS[key]);
}

export function buildCollectionCreatePayload(
  input: CollectionCreateInput,
  createId: () => string = () => crypto.randomUUID(),
): CollectionCreatePayload {
  const data = collectionCreateSchema.parse(input);
  const preset = getCollectionPreset(data.presetKey);
  const draft =
    data.fields ??
    preset.fields.map((field) => ({
      ...field,
      required: false,
      options: field.options ?? [],
    }));
  const fieldIds = draft.map(() => createId());
  const fields = draft.map((field, position) => {
    const id = fieldIds.at(position);
    if (!id) throw new Error("Preset field ID generation failed.");

    return {
      id,
      name: field.name,
      options: (field.options ?? []).map((label, optionPosition) => ({
        id: createId(),
        label,
        position: optionPosition,
      })),
      position,
      required: field.required,
      type: field.type,
    };
  });

  return {
    description: data.description,
    fields,
    name: data.name,
    presetKey: data.presetKey,
    requestId: data.requestId,
    viewConfig: {
      aspectRatio: preset.aspectRatio,
      columns: 3,
      imageFit: "cover",
      showDetails: true,
      sortBy: "createdAt",
      sortDirection: "desc",
      spacing: "normal",
      visibleFieldIds: ["title", ...fieldIds.slice(0, 2)],
    },
  };
}
