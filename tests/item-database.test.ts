import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20261030100000_create_item_operations.sql",
  ),
  "utf8",
).toLowerCase();

describe("atomic Item operations migration", () => {
  it("validates the live schema and writes in the same authenticated RPC", () => {
    expect(sql).toContain(
      "create or replace function public.validate_item_values",
    );
    expect(sql).toContain(
      "create or replace function public.create_item_with_values",
    );
    expect(sql).toContain(
      "create or replace function public.update_item_with_values",
    );
    expect(sql).toContain("perform public.validate_item_values");
    expect(sql).toContain("owner_id = auth.uid()");
    expect(sql).toContain(
      "grant execute on function public.create_item_with_values",
    );
    expect(sql).not.toMatch(/p_owner|owner_id uuid/);
  });

  it("rejects unknown fields, missing required values, stale options, and wrong types", () => {
    expect(sql).toContain("jsonb_object_keys(p_values)");
    expect(sql).toContain("field_record.required");
    expect(sql).toContain("public.field_options");
    expect(sql).toContain("jsonb_typeof(value)");
  });
});
