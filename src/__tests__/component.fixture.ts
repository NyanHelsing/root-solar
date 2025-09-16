import type { Locator } from "@playwright/test";
import { test as base } from "@playwright/test";

type MountOptions = {
  props?: Record<string, unknown>;
  searchParams?: Record<string, string>;
};

type Fixtures = {
  mount: (componentName: string, options?: MountOptions) => Promise<Locator>;
};

const toSlug = (value: string): string =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const test = base.extend<Fixtures>({
  mount: async ({ page }, use) => {
    await use(async (componentName, options = {}) => {
      const slug = toSlug(componentName);
      const params = new URLSearchParams(options.searchParams);

      if (options.props) {
        params.set("props", JSON.stringify(options.props));
      }

      const query = params.toString();
      const url = `/__component__/${encodeURIComponent(slug)}${
        query ? `?${query}` : ""
      }`;

      await page.goto(url);
      await page.waitForSelector("[data-component-root]");

      return page.locator("[data-component-root]");
    });
  },
});

export { expect } from "@playwright/test";
