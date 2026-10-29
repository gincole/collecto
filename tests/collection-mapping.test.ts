import { describe, expect, it } from "vitest";

import { mapCollectionRecord } from "@/features/collections/models";

const viewConfig = {
  aspectRatio: "2:3",
  columns: 3,
  imageFit: "cover",
  showDetails: true,
  sortBy: "createdAt",
  sortDirection: "desc",
  spacing: "normal",
  visibleFieldIds: ["title"],
};

describe("Collection database mapping", () => {
  it("validates JSONB and returns fields and options in position order", () => {
    const result = mapCollectionRecord({
      created_at: "2026-10-29T00:00:00.000Z",
      description: null,
      field_definitions: [
        {
          field_options: [],
          id: "00000000-0000-4000-8000-000000000002",
          name: "Rating",
          position: 1,
          required: false,
          type: "rating",
        },
        {
          field_options: [
            {
              id: "00000000-0000-4000-8000-000000000004",
              label: "Second",
              position: 1,
            },
            {
              id: "00000000-0000-4000-8000-000000000003",
              label: "First",
              position: 0,
            },
          ],
          id: "00000000-0000-4000-8000-000000000001",
          name: "Status",
          position: 0,
          required: false,
          type: "select",
        },
      ],
      id: "00000000-0000-4000-8000-000000000000",
      name: "Collection",
      preset_key: "book",
      items: [{ count: 7 }],
      updated_at: "2026-10-29T00:00:00.000Z",
      view_config: viewConfig,
    });

    expect(result.fields.map((field) => field.name)).toEqual([
      "Status",
      "Rating",
    ]);
    expect(result.fields[0]!.options.map((option) => option.label)).toEqual([
      "First",
      "Second",
    ]);
    expect(result).toMatchObject({
      itemCount: 7,
      presetKey: "book",
      viewConfig,
    });
  });

  it("rejects malformed gallery JSON from the database", () => {
    expect(() =>
      mapCollectionRecord({
        created_at: "2026-10-29T00:00:00.000Z",
        description: null,
        field_definitions: [],
        id: "00000000-0000-4000-8000-000000000000",
        name: "Collection",
        preset_key: "blank",
        items: [{ count: 0 }],
        updated_at: "2026-10-29T00:00:00.000Z",
        view_config: { columns: 99 },
      }),
    ).toThrow();
  });
});
