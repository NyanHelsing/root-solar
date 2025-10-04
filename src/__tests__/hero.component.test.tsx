import { expect, test } from "./component.fixture";

test.describe("Hero component", () => {
    test("renders the headline", async ({ mount }) => {
        const component = await mount("Hero");
        await expect(component.getByRole("heading", { level: 1 })).toHaveText(
            "Life shares a common root.",
        );
    });
});
