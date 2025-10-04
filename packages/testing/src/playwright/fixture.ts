import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { Locator } from "@playwright/test";
import { expect as baseExpect, test as base } from "@playwright/test";

import { buildComponentUrl, type BuildComponentUrlOptions } from "../routes.ts";

export type MountOptions = BuildComponentUrlOptions;

export type ComponentTestFixtures = {
    mount: (componentName: string, options?: MountOptions) => Promise<Locator>;
};

export const test = base.extend<ComponentTestFixtures>({
    mount: async ({ page }, use) => {
        await use(async (componentName, options = {}) => {
            const componentPath = buildComponentUrl(componentName, options);
            const harnessHtmlPath = path.resolve(process.cwd(), "dist/testing/harness.html");

            if (!existsSync(harnessHtmlPath)) {
                throw new Error(
                    "Component harness build not found at dist/testing/harness.html. " +
                        "Run `pnpm rsbuild build --config packages/testing/rsbuild.config.ts` before executing component tests."
                );
            }

            const harnessUrl = new URL(pathToFileURL(harnessHtmlPath).href);
            harnessUrl.hash = componentPath.startsWith("/") ? `#${componentPath}` : componentPath;

            await page.goto(harnessUrl.href);
            await page.waitForSelector("[data-component-root]");
            return page.locator("[data-component-root]");
        });
    }
});

export const expect = baseExpect;
