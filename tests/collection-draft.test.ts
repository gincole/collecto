import { describe, expect, it } from "vitest";
import {
  buildCollectionCreatePayload,
  collectionCreateSchema,
  getCollectionPreset,
} from "@/features/collections";

const base = {
  name: "Edited books",
  presetKey: "book" as const,
  requestId: "00000000-0000-4000-8000-000000000001",
};
const fields = [
  {
    name: " Read status ",
    type: "select" as const,
    required: true,
    options: [" Started ", "Done"],
  },
  { name: "Pages", type: "number" as const, required: false, options: [] },
];

describe("Collection creation schema drafts", () => {
  it("uses the final draft order, types, required flags and options rather than the preset", () => {
    const payload = buildCollectionCreatePayload({ ...base, fields });
    expect(payload.fields).toMatchObject([
      {
        name: "Read status",
        type: "select",
        position: 0,
        required: true,
        options: [
          { label: "Started", position: 0 },
          { label: "Done", position: 1 },
        ],
      },
      {
        name: "Pages",
        type: "number",
        position: 1,
        required: false,
        options: [],
      },
    ]);
    expect(payload.viewConfig.visibleFieldIds).toEqual([
      "title",
      ...payload.fields.map((field) => field.id),
    ]);
    expect(getCollectionPreset("book").fields[0]?.name).toBe("Author");
    const ids = payload.fields.flatMap((field) => [
      field.id,
      ...field.options.map((option) => option.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("accepts an explicitly empty draft and customized Blank", () => {
    expect(
      buildCollectionCreatePayload({ ...base, fields: [] }).fields,
    ).toEqual([]);
    expect(
      buildCollectionCreatePayload({ ...base, presetKey: "blank", fields })
        .fields,
    ).toHaveLength(2);
  });
  it.each([
    [{ ...fields[0], name: "" }],
    [{ ...fields[0], type: "unsupported" }],
    [{ ...fields[0], required: "true" }],
    [{ ...fields[0], options: ["Same", " same "] }],
    [{ ...fields[0], options: [""] }],
    [
      {
        ...fields[0],
        options: Array.from({ length: 51 }, (_, index) => String(index)),
      },
    ],
    [{ ...fields[1], options: ["Unexpected"] }],
    [{ ...fields[1], name: "a".repeat(65) }],
    [
      { ...fields[1], name: "Same" },
      { ...fields[1], name: " same " },
    ],
    Array.from({ length: 31 }, (_, index) => ({
      ...fields[1],
      name: String(index),
    })),
    [{ ...fields[1], id: "client-chosen-id" }],
  ])("rejects invalid or forged drafts before persistence: %j", (...draft) => {
    expect(
      collectionCreateSchema.safeParse({ ...base, fields: draft }).success,
    ).toBe(false);
  });
});
