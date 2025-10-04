import { expect, test } from "@playwright/test";

test.describe("application", () => {
    test("renders the landing page", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Life shares a common root."
        );
    });
});
