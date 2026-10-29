import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DATABASE_LIMITS } from "@/lib/validation/limits";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20261029183000_create_core_schema.sql",
);
const databaseTypesPath = join(process.cwd(), "lib/supabase/database.types.ts");
const limitsPath = join(process.cwd(), "lib/validation/limits.ts");
const databaseTestPath = join(
  process.cwd(),
  "supabase/tests/database/001_core_schema.test.sql",
);

describe("core database schema", () => {
  it("defines every P0 table and enum in a forward migration", () => {
    expect(existsSync(migrationPath)).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");

    for (const typeName of [
      "field_type",
      "cleanup_job_operation",
      "cleanup_job_status",
    ]) {
      expect(migration).toContain(`create type public.${typeName}`);
    }

    for (const tableName of [
      "collections",
      "field_definitions",
      "field_options",
      "items",
      "storage_cleanup_jobs",
    ]) {
      expect(migration).toContain(`create table public.${tableName}`);
    }
  });

  it("protects lengths, JSON shapes, positions, and case-insensitive names", () => {
    const migration = readFileSync(migrationPath, "utf8");

    for (const constraint of [
      "collections_name_length",
      "collections_description_length",
      "collections_view_config_object",
      "field_definitions_name_length",
      "field_definitions_position_nonnegative",
      "field_options_label_length",
      "field_options_position_nonnegative",
      "items_title_length",
      "items_description_length",
      "items_values_object",
      "storage_cleanup_jobs_attempt_count_nonnegative",
    ]) {
      expect(migration).toContain(`constraint ${constraint}`);
    }

    expect(migration).toContain(
      "create unique index field_definitions_collection_name_unique",
    );
    expect(migration).toContain(
      "create unique index field_options_field_label_unique",
    );
    expect(migration).toContain("enforce_collection_field_limit");
    expect(migration).toContain("enforce_select_option_limit");
  });

  it("cascades Collection children while retaining cleanup jobs", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toMatch(
      /field_definitions[\s\S]*references public\.collections \(id\) on delete cascade/,
    );
    expect(migration).toMatch(
      /field_options[\s\S]*references public\.field_definitions \(id\) on delete cascade/,
    );
    expect(migration).toMatch(
      /items[\s\S]*references public\.collections \(id\) on delete cascade/,
    );
    expect(migration).toMatch(
      /storage_cleanup_jobs[\s\S]*references public\.collections \(id\) on delete set null/,
    );
    expect(migration).toMatch(
      /storage_cleanup_jobs[\s\S]*references public\.items \(id\) on delete set null/,
    );
  });

  it("adds the query indexes required by the database design", () => {
    const migration = readFileSync(migrationPath, "utf8");

    for (const indexName of [
      "collections_owner_created_idx",
      "items_collection_created_idx",
    ]) {
      expect(migration).toContain(`create index ${indexName}`);
    }

    for (const indexName of [
      "field_definitions_collection_position_idx",
      "field_options_field_position_idx",
    ]) {
      expect(migration).toContain(`create unique index ${indexName}`);
    }
  });

  it("includes an executable transaction test for defaults and cascades", () => {
    expect(existsSync(databaseTestPath)).toBe(true);

    const databaseTest = readFileSync(databaseTestPath, "utf8");

    expect(databaseTest).toContain("begin;");
    expect(databaseTest).toContain("rollback;");
    expect(databaseTest).toContain("view_config default");
    expect(databaseTest).toContain("Cleanup job was not retained");
    expect(databaseTest).toContain("case-insensitive duplicate Field name");
    expect(databaseTest).toContain("Item values default");
    expect(databaseTest).toContain("duplicate Field position");
    expect(databaseTest).toContain("duplicate Select option label");
    expect(databaseTest).toContain("30 custom fields");
    expect(databaseTest).toContain("50 options");
  });

  it("publishes shared validation limits and generated database types", () => {
    expect(existsSync(limitsPath)).toBe(true);
    expect(existsSync(databaseTypesPath)).toBe(true);

    const databaseTypes = readFileSync(databaseTypesPath, "utf8");

    expect(DATABASE_LIMITS).toEqual({
      collectionDescription: 1_000,
      collectionFields: 30,
      collectionName: 100,
      fieldName: 64,
      itemDescription: 5_000,
      itemTitle: 200,
      selectOptionLabel: 64,
      selectOptions: 50,
      url: 2_048,
    });

    for (const tableName of [
      "collections",
      "field_definitions",
      "field_options",
      "items",
      "storage_cleanup_jobs",
    ]) {
      expect(databaseTypes).toContain(`${tableName}: {`);
    }
  });
});
