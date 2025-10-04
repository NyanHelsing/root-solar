import { expect, test } from "@playwright/test";

test.describe("shell homepage", () => {
    test("renders the hero headline", async ({ page }) => {
        await page.goto("/");

        const heroHeading = page.getByRole("heading", { name: "Life shares a common root." });
        await expect(heroHeading).toBeVisible();
    });
});
