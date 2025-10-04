import { expect, test } from "@root-solar/testing/playwright";

test.describe("RootSolarHomepage", () => {
    test("renders hero copy", async ({ mount }) => {
        const component = await mount("RootSolarHomepage");

        await expect(component.getByRole("heading", { level: 1 })).toHaveText(
            "Life shares a common root."
        );
        await expect(component).toContainText("Open canon for shared stewardship");
    });
});
