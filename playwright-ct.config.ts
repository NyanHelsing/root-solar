import { defineConfig, devices } from "@playwright/test";

const HOST = "127.0.0.1";
const PORT = 4174;
const BASE_URL = `http://${HOST}:${PORT}`;

export default defineConfig({
    testDir: "./src",
    testMatch: /.*\\.component\\.test\\.(ts|tsx)$/,
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        headless: true
    },
    webServer: {
        command: "pnpm rsbuild dev --host 127.0.0.1 --port 4174",
        url: BASE_URL,
        timeout: 120000,
        reuseExistingServer: !process.env.CI
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
