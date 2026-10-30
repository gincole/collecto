import { describe, expect, it } from "vitest";

import { validateItemInput } from "@/features/items/schemas";

const collectionId = "00000000-0000-4000-8000-000000000001";
const optionId = "00000000-0000-4000-8000-000000000002";
const fields = [
  {
    id: "00000000-0000-4000-8000-000000000010",
    name: "Notes",
    options: [],
    position: 0,
    required: false,
    type: "text" as const,
  },
  {
    id: "00000000-0000-4000-8000-000000000011",
    name: "Price",
    options: [],
    position: 1,
    required: true,
    type: "number" as const,
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    name: "Date",
    options: [],
    position: 2,
    required: false,
    type: "date" as const,
  },
  {
    id: "00000000-0000-4000-8000-000000000013",
    name: "Rating",
    options: [],
    position: 3,
    required: false,
    type: "rating" as const,
  },
  {
    id: "00000000-0000-4000-8000-000000000014",
    name: "Status",
    options: [{ id: optionId, label: "Saved", position: 0 }],
    position: 4,
    required: false,
    type: "select" as const,
  },
  {
    id: "00000000-0000-4000-8000-000000000015",
    name: "Source",
    options: [],
    position: 5,
    required: false,
    type: "url" as const,
  },
];

describe("Item schema validation", () => {
  it("normalizes every supported type and omits empty optional values", () => {
    const result = validateItemInput(
      {
        collectionId,
        description: "  remembered well  ",
        title: "  Small thing  ",
        values: {
          [fields[0].id]: "",
          [fields[1].id]: "12.50",
          [fields[2].id]: "2026-10-30",
          [fields[3].id]: "5",
          [fields[4].id]: optionId,
          [fields[5].id]: "https://example.com/memory",
        },
      },
      fields,
    );

    expect(result).toEqual({
      data: {
        collectionId,
        description: "remembered well",
        title: "Small thing",
        values: {
          [fields[1].id]: 12.5,
          [fields[2].id]: "2026-10-30",
          [fields[3].id]: 5,
          [fields[4].id]: optionId,
          [fields[5].id]: "https://example.com/memory",
        },
      },
      success: true,
    });
  });

  it("rejects missing required, unknown, stale option, invalid URL, and invalid rating values", () => {
    const result = validateItemInput(
      {
        collectionId,
        title: "",
        values: {
          [fields[3].id]: "6",
          [fields[4].id]: "00000000-0000-4000-8000-000000000099",
          [fields[5].id]: "ftp://example.com",
          "00000000-0000-4000-8000-000000000098": "foreign",
        },
      },
      fields,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.title).toBe("Enter an Item title.");
      expect(result.fieldErrors[`values.${fields[1].id}`]).toContain("Price");
      expect(result.fieldErrors[`values.${fields[3].id}`]).toContain("1 to 5");
      expect(result.fieldErrors[`values.${fields[4].id}`]).toContain(
        "current option",
      );
      expect(result.fieldErrors[`values.${fields[5].id}`]).toContain(
        "HTTP or HTTPS",
      );
      expect(result.formError).toContain("current Collection schema");
    }
  });

  it("rejects impossible date-only values", () => {
    const result = validateItemInput(
      {
        collectionId,
        title: "Memory",
        values: { [fields[1].id]: "1", [fields[2].id]: "2026-02-31" },
      },
      fields,
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.fieldErrors[`values.${fields[2].id}`]).toContain(
        "valid date",
      );
  });
});
