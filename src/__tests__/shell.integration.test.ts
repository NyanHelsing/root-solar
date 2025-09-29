import { expect, test } from "@playwright/test";

test.describe("root shell app", () => {
  test("renders the shell navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "root.solar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Missives" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Axioms" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tags" })).toBeVisible();
  });

  test("wraps homepage content inside the shell layout", async ({ page }) => {
    await page.goto("/");

    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main.getByRole("heading", { name: "Life shares a common root." })).toBeVisible();
  });

  test("exposes footer metadata", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");
    const currentYear = new Date().getFullYear().toString();

    await expect(footer).toContainText(currentYear);
    await expect(footer).toContainText("root.solar");
    await expect(footer.getByRole("link", { name: "About" })).toBeVisible();
  });
});
