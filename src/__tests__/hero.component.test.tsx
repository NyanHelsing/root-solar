import { expect, test } from "@playwright/experimental-ct-react";

import Hero from "../Hero.tsx";

test.describe("Hero component", () => {
  test("renders the headline", async ({ mount }) => {
    const component = await mount(<Hero />);
    await expect(component.getByRole("heading", { level: 1 })).toHaveText(
      "Life shares a common root.",
    );
  });
});
