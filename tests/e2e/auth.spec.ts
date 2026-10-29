import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const email = `auth-e2e-${crypto.randomUUID()}@example.test`;
const password = "Example-pass-42!";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.LOCAL_SUPABASE_SECRET_KEY;

test.describe("authentication journey", () => {
  test.afterAll(async () => {
    if (!supabaseUrl || !secretKey) return;

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const users = await admin.auth.admin.listUsers();
    const user = users.data.users.find(
      (candidate) => candidate.email === email,
    );

    if (user) await admin.auth.admin.deleteUser(user.id);
  });

  test("registers, persists the session, logs out locally, and logs back in", async ({
    browser,
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto("/library");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Flibrary$/);

    await page.getByLabel("Email").fill("unknown@example.test");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(
      page.getByText("Email or password is incorrect.", { exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/\/register\?returnTo=%2Flibrary$/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/library$/);
    await expect(
      page.getByRole("heading", { name: "My Library" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "My Library" }),
    ).toBeVisible();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await secondPage.goto("/login");
    await secondPage.getByLabel("Email").fill(email);
    await secondPage.getByLabel("Password").fill(password);
    await secondPage.getByRole("button", { name: "Log in" }).click();
    await expect(secondPage).toHaveURL(/\/library$/);

    await page.locator("summary").click();
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await secondPage.reload();
    await expect(
      secondPage.getByRole("heading", { name: "My Library" }),
    ).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/library$/);
    await secondContext.close();
  });

  test("supports keyboard-only registration through the final mobile action", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 800, width: 375 });
    await page.goto("/register");

    const emailField = page.getByLabel("Email");
    await emailField.focus();
    await expect(emailField).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Confirm password")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
  });

  test("explains an invalid email confirmation without exposing provider details", async ({
    page,
  }) => {
    await page.goto("/auth/callback?code=invalid-confirmation");

    await expect(page).toHaveURL(/\/login\?error=confirmation$/);
    await expect(
      page.getByText(
        "The confirmation link is invalid or expired. Try logging in or create a new account.",
      ),
    ).toBeVisible();
  });

  for (const width of [320, 375, 1440]) {
    test(`keeps the login form usable without horizontal overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: 800, width });
      await page.goto("/login");

      await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );
    });
  }
});
