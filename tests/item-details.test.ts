import { describe, expect, it } from "vitest";

import { getItemDetailRows } from "@/features/items/item-details";
import type { ItemFieldDefinition, ItemRecord } from "@/features/items/types";

const selectId = "00000000-0000-4000-8000-000000000010";
const ratingId = "00000000-0000-4000-8000-000000000011";
const emptyId = "00000000-0000-4000-8000-000000000012";
const numberId = "00000000-0000-4000-8000-000000000013";
const dateId = "00000000-0000-4000-8000-000000000014";
const fields: ItemFieldDefinition[] = [
  {
    id: selectId,
    name: "Status",
    options: [
      {
        id: "00000000-0000-4000-8000-000000000020",
        label: "Remembered",
        position: 0,
      },
    ],
    position: 0,
    required: false,
    type: "select",
  },
  {
    id: numberId,
    name: "Amount",
    options: [],
    position: 3,
    required: false,
    type: "number",
  },
  {
    id: dateId,
    name: "Remembered on",
    options: [],
    position: 4,
    required: false,
    type: "date",
  },
  {
    id: ratingId,
    name: "Rating",
    options: [],
    position: 1,
    required: false,
    type: "rating",
  },
  {
    id: emptyId,
    name: "Notes",
    options: [],
    position: 2,
    required: false,
    type: "text",
  },
];
const item: ItemRecord = {
  collectionId: "00000000-0000-4000-8000-000000000001",
  createdAt: "2026-10-30T00:00:00Z",
  description: null,
  id: "00000000-0000-4000-8000-000000000002",
  imagePath: null,
  title: "Memory",
  updatedAt: "2026-10-30T00:00:00Z",
  values: {
    [selectId]: "00000000-0000-4000-8000-000000000020",
    [ratingId]: 4,
    [numberId]: 1234.5,
    [dateId]: "2026-10-30",
  },
};

describe("Item detail rows", () => {
  it("follows schema order, resolves Select labels, and formats Rating accurately", () => {
    expect(getItemDetailRows(item, fields)).toEqual([
      { kind: "text", label: "Status", value: "Remembered" },
      { kind: "rating", label: "Rating", value: 4 },
      { kind: "number", label: "Amount", value: 1234.5 },
      { kind: "date", label: "Remembered on", value: "2026-10-30" },
    ]);
  });

  it("omits empty values and stale Select option IDs instead of inventing content", () => {
    expect(
      getItemDetailRows(
        {
          ...item,
          values: { [selectId]: "00000000-0000-4000-8000-000000000099" },
        },
        fields,
      ),
    ).toEqual([]);
  });
});
