import { expect, test } from "@playwright/test";

test.describe("root.solar homepage", () => {
    test("renders the hero headline", async ({ page }) => {
        await page.goto("/");
        await expect(
            page.getByRole("heading", { name: "Life shares a common root." })
        ).toBeVisible();
    });

    test("exposes the primary call to action", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("button", { name: "Enter the commons" })).toBeVisible();
    });
});
