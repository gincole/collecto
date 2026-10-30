import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20261030140000_field_operations.sql",
  ),
  "utf8",
).toLowerCase();

describe("atomic Field and Option operations migration", () => {
  it("protects immutable types and restricts option RPCs to Select fields", () => {
    expect(sql).toContain("field type is immutable");
    expect(sql).toContain("field collection is immutable");
    expect(sql).toContain("fields.type = 'select'");
  });

  it("exposes owner-scoped create update reorder impact and delete RPCs", () => {
    for (const name of [
      "create_field",
      "update_field",
      "reorder_fields",
      "get_field_delete_impact",
      "delete_field_with_cleanup",
      "create_field_option",
      "update_field_option",
      "reorder_field_options",
      "get_option_delete_impact",
      "delete_option_with_cleanup",
    ])
      expect(sql).toContain(`function public.${name}`);
    expect(sql).toContain("collections.owner_id = auth.uid()");
  });

  it("removes deleted values and gallery references atomically", () => {
    expect(sql).toContain("values = items.values - p_field_id::text");
    expect(sql).toContain("visiblefieldids");
    expect(sql).toContain(
      "items.values ->> p_field_id::text = p_option_id::text",
    );
  });

  it("serializes schema changes and Item saves on their parent Collection", () => {
    expect(sql.match(/for update;/g)?.length).toBeGreaterThanOrEqual(7);
    expect(sql.match(/for share;/g)).toHaveLength(2);
    expect(sql).toContain(
      "create or replace function public.create_item_with_values",
    );
    expect(sql).toContain(
      "create or replace function public.update_item_with_values",
    );
  });
});
