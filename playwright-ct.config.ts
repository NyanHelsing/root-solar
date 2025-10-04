import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./",
    testMatch: ["packages/**/*.component.test.ts", "packages/**/*.component.test.tsx"],
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    globalSetup: "./playwright-ct.setup.ts",
    use: {
        trace: "on-first-retry",
        headless: true
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"]
            }
        }
    ]
});
