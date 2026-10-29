import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const email = `collections-e2e-${crypto.randomUUID()}@example.test`;
const password = "Example-pass-42!";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.LOCAL_SUPABASE_SECRET_KEY;

test.describe("Collection creation journey", () => {
  test.skip(
    !supabaseUrl || !secretKey,
    "Local Supabase credentials are required.",
  );

  const admin =
    supabaseUrl && secretKey
      ? createClient(supabaseUrl, secretKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;
  let userId: string | undefined;

  test.beforeAll(async () => {
    if (!admin) return;
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
    });
    expect(created?.error).toBeNull();
    userId = created?.data.user?.id;
  });

  test.afterAll(async () => {
    if (admin && userId) await admin.auth.admin.deleteUser(userId);
  });

  test("creates preset and Blank Collections only after final confirmation", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    if (!admin || !userId)
      throw new Error("Local Collection test setup failed.");
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/library$/);

    await page
      .getByRole("link", { name: "Create your first collection" })
      .click();
    const presetAccessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(presetAccessibility.violations).toEqual([]);
    await page.getByRole("button", { name: "Books preset" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    const beforeCreate = await admin
      .from("collections")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    expect(beforeCreate.count).toBe(0);

    await page.getByLabel("Collection name").fill("My E2E Books");
    await page
      .getByLabel("Description (optional)")
      .fill("Stories worth keeping");
    const detailsAccessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(detailsAccessibility.violations).toEqual([]);
    await page.getByRole("button", { name: "Create collection" }).click();
    await expect(page).toHaveURL(/\/collections\/[0-9a-f-]+$/);
    await expect(
      page.getByRole("heading", { name: "My E2E Books" }),
    ).toBeVisible();

    const createdPreset = await admin
      .from("collections")
      .select("id, field_definitions(id, field_options(id))")
      .eq("owner_id", userId)
      .eq("name", "My E2E Books")
      .single();
    expect(createdPreset.error).toBeNull();
    expect(createdPreset.data?.field_definitions).toHaveLength(4);

    await page.goto("/collections/new");
    await page.getByRole("button", { name: "Blank preset" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Collection name").fill("Small Joys");
    await page.getByRole("button", { name: "Create collection" }).click();
    await expect(
      page.getByRole("heading", { name: "Small Joys" }),
    ).toBeVisible();

    await page.goto("/library");
    await expect(
      page.getByRole("link", { name: "Open My E2E Books" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open Small Joys" }),
    ).toBeVisible();

    const viewportColumns = [
      [320, 1],
      [375, 2],
      [640, 2],
      [768, 3],
      [1024, 3],
      [1440, 4],
    ] as const;

    for (const [width, expectedColumns] of viewportColumns) {
      await page.setViewportSize({ height: 900, width });
      await page.goto("/library");
      const renderedColumns = await page
        .locator("section[aria-label='Collections'] ul")
        .evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(" ").length,
        );
      expect(renderedColumns).toBe(expectedColumns);

      await page.goto("/collections/new");
      const booksPreset = page.getByRole("button", { name: "Books preset" });
      await expect(booksPreset).toBeVisible();
      const presetBox = await booksPreset.boundingBox();
      expect(presetBox?.height).toBeGreaterThanOrEqual(44);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );

      await booksPreset.click();
      await page.getByRole("button", { name: "Continue" }).click();
      const detailColumns = await page
        .getByTestId("collection-details-layout")
        .evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(" ").length,
        );
      expect(detailColumns).toBe(width >= 1024 ? 2 : 1);
    }
  });
});
