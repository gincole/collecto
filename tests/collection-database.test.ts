import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20261029213000_create_collection_operations.sql",
);

describe("atomic Collection creation migration", () => {
  it("creates an authenticated, idempotent RPC without an owner argument", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toContain(
      "create or replace function public.create_collection_with_schema",
    );
    expect(sql).toContain("auth.uid()");
    expect(sql).toContain(
      "on conflict (owner_id, creation_request_id) do nothing",
    );
    expect(sql).toContain("p_request_id uuid");
    expect(sql).not.toContain("p_collection_id");
    expect(sql).toContain(
      "revoke all on function public.create_collection_with_schema",
    );
    expect(sql).toContain(
      "grant execute on function public.create_collection_with_schema",
    );
    expect(sql).not.toMatch(/p_owner|owner_id uuid/);
  });

  it("copies fields and Select options in the same database transaction", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toContain("insert into public.field_definitions");
    expect(sql).toContain("insert into public.field_options");
    expect(sql).toContain("jsonb_to_recordset");
  });
});
