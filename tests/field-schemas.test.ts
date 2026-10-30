import { describe, expect, it } from "vitest";

import {
  fieldCreateSchema,
  fieldReorderSchema,
  fieldUpdateSchema,
  optionCreateSchema,
} from "@/features/fields/schemas";

const collectionId = "90000000-0000-4000-8000-000000000001";
const fieldId = "91000000-0000-4000-8000-000000000001";

describe("Field and option mutation schemas", () => {
  it("accepts exactly the six immutable field types", () => {
    for (const type of ["text", "number", "date", "rating", "select", "url"])
      expect(
        fieldCreateSchema.safeParse({
          collectionId,
          name: "Field",
          required: false,
          type,
        }).success,
      ).toBe(true);
    expect(
      fieldCreateSchema.safeParse({
        collectionId,
        name: "Field",
        required: false,
        type: "textarea",
      }).success,
    ).toBe(false);
  });

  it("does not accept type changes on update", () => {
    expect(
      fieldUpdateSchema.safeParse({
        collectionId,
        fieldId,
        name: "Renamed",
        type: "number",
      }).success,
    ).toBe(false);
  });

  it("requires a complete unique ordered ID list", () => {
    expect(
      fieldReorderSchema.safeParse({
        collectionId,
        fieldIds: [fieldId, fieldId],
      }).success,
    ).toBe(false);
  });

  it("trims names and option labels within database limits", () => {
    expect(
      fieldCreateSchema.parse({
        collectionId,
        name: "  Memory  ",
        required: true,
        type: "text",
      }).name,
    ).toBe("Memory");
    expect(
      optionCreateSchema.parse({ collectionId, fieldId, label: "  Kept  " })
        .label,
    ).toBe("Kept");
  });
});
