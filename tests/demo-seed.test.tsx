import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildDemoData } from "../supabase/seed/demo-data";
import { galleryConfigSchema } from "@/features/collections/schemas";
import { DemoNotice } from "@/components/shared/demo-notice";
import { spawnSync } from "node:child_process";

describe("fictional demo seed", () => {
  it.each([[], ["--confirm-owner=00000000-0000-4000-8000-000000000002"]])(
    "rejects reset without the exact configured owner before connecting: %j",
    (...confirmation) => {
      const result = spawnSync(
        process.execPath,
        ["scripts/demo.mjs", "--reset", ...confirmation],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1",
            SUPABASE_SECRET_KEY: "fixture-admin-key",
            DEMO_USER_EMAIL: "fixture@example.test",
            DEMO_USER_ID: "00000000-0000-4000-8000-000000000001",
          },
        },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Reset requires --confirm-owner");
      expect(result.stderr).not.toContain("fixture-admin-key");
    },
  );
  it("builds three independent Collections with six fictional Items and valid gallery references", () => {
    const collections = buildDemoData();
    expect(collections.map((c) => c.name)).toEqual([
      "My Books",
      "Food Memories",
      "My Collectibles",
    ]);
    for (const collection of collections) {
      expect(collection.items).toHaveLength(6);
      expect(galleryConfigSchema.safeParse(collection.viewConfig).success).toBe(
        true,
      );
      const ids = new Set(collection.fields.map((field) => field.id));
      expect(
        collection.viewConfig.visibleFieldIds
          .slice(1)
          .every((id) => ids.has(id)),
      ).toBe(true);
      for (const item of collection.items)
        for (const [id, value] of Object.entries(item.values)) {
          const field = collection.fields.find((field) => field.id === id);
          expect(field).toBeDefined();
          if (field?.type === "select")
            expect(field.options.some((option) => option.id === value)).toBe(
              true,
            );
        }
    }
    expect(buildDemoData()[0]?.id).not.toBe(collections[0]?.id);
  });
  it("discloses shared writable state, last-save behavior and fictional data", () => {
    render(<DemoNotice />);
    expect(
      screen.getByRole("complementary", { name: "Shared demo account" }),
    ).toHaveTextContent(/Other visitors can see and change/);
    expect(screen.getByText(/The last saved change wins/)).toHaveTextContent(
      /fictional information only/,
    );
  });
});
