import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const email = `items-e2e-${crypto.randomUUID()}@example.test`;
const password = "Example-pass-42!";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.LOCAL_SUPABASE_SECRET_KEY;

test.describe("Item create, details, edit, and delete journey", () => {
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
    expect(created.error).toBeNull();
    userId = created.data.user?.id;
  });
  test.afterAll(async () => {
    if (admin && userId) await admin.auth.admin.deleteUser(userId);
  });

  test("renders owned details and confirms destructive deletion at mobile and desktop widths", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    if (!admin || !userId) throw new Error("Local Item test setup failed.");
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page
      .getByRole("link", { name: "Create your first collection" })
      .click();
    await page.getByRole("button", { name: "Books preset" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Collection name").fill("Item Flow Books");
    await page.getByRole("button", { name: "Create collection" }).click();
    await expect(page).toHaveURL(/\/collections\/[0-9a-f-]+$/);
    await page.getByRole("link", { name: "Add item" }).click();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.getByLabel("Title").fill("Atomic Habits");
    await page.getByLabel("Author").fill("James Clear");
    await page.getByLabel("Genre").selectOption({ label: "Nonfiction" });
    await page.getByLabel("Status").selectOption({ label: "Finished" });
    await page.getByLabel("Rating").fill("5");
    await page.getByLabel("Item image").setInputFiles({
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
      mimeType: "image/png",
      name: "private-original-name.png",
    });
    await page.getByRole("button", { name: "Save item" }).click();
    await expect(page).toHaveURL(/\/collections\/[0-9a-f-]+$/);
    await page.getByRole("link", { name: "View Atomic Habits" }).click();
    await expect(page).toHaveURL(
      /\/collections\/[0-9a-f-]+\/items\/[0-9a-f-]+$/,
    );
    await expect(
      page.getByRole("heading", { name: "Atomic Habits" }),
    ).toBeVisible();
    await expect(page.getByText("Nonfiction", { exact: true })).toBeVisible();
    await expect(page.getByLabel("5 out of 5")).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    const saved = await admin
      .from("items")
      .select("id, image_path, title, values, collections!inner(owner_id)")
      .eq("collections.owner_id", userId)
      .single();
    expect(saved.error).toBeNull();
    expect(saved.data?.title).toBe("Atomic Habits");
    expect(saved.data?.image_path).toMatch(
      new RegExp(`^${userId}/[0-9a-f-]+/${saved.data?.id}/[0-9a-f-]+[.]png$`),
    );
    expect(saved.data?.image_path).not.toContain("private-original-name");
    expect(Object.values(saved.data?.values ?? {})).toContain(5);
    await expect(
      page.getByRole("link", { name: "View full size" }),
    ).toHaveAttribute("href", `/api/items/${saved.data?.id}/image`);
    await page.getByRole("link", { name: "Edit item" }).click();
    await expect(page.getByAltText("Item preview")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View full size" }),
    ).toHaveAttribute("href", `/api/items/${saved.data?.id}/image`);
    await page.getByLabel("Title").fill("Atomic Habits Updated");
    await page.getByRole("button", { name: "Remove" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/collections/[0-9a-f-]+/items/${saved.data?.id}$`),
    );
    await expect
      .poll(
        async () =>
          (
            await admin
              .from("items")
              .select("image_path")
              .eq("id", saved.data!.id)
              .single()
          ).data?.image_path,
      )
      .toBeNull();
    await page.reload();
    await expect(
      page.getByText("Atomic Habits Updated", { exact: true }),
    ).toBeVisible();
    for (const width of [320, 375, 640, 768, 1024, 1440]) {
      await page.setViewportSize({ height: 900, width });
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );
      await expect(
        page.getByRole("button", { name: "Delete item" }),
      ).toBeVisible();
    }
    await expect(page.getByText("No image")).toBeVisible();
    await page.getByRole("button", { name: "Delete item" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    const confirmDelete = page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete item" });
    await confirmDelete.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/collections\/[0-9a-f-]+$/);
    await expect(page.getByText("No items yet")).toBeVisible();
    expect(
      (await admin.from("items").select("id").eq("id", saved.data!.id)).data,
    ).toEqual([]);
  });
});
