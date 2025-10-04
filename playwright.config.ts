import { defineConfig, devices } from "@playwright/test";

const HOST = "127.0.0.1";
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;
const HEALTHCHECK_URL = `${BASE_URL}/health`;

const SERVER_ENV = {
    ENV: "development",
    NODE_ENV: "development",
    DISABLE_NETWORK: "true",
    FRONTEND_DEV_DISABLED: "true",
    HOST,
    PORT: String(PORT)
};

export default defineConfig({
    testDir: "./src",
    testMatch: ["**/*.integration.test.ts", "**/*.integration.test.tsx"],
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        headless: true
    },
    webServer: {
        command: "pnpm start",
        url: HEALTHCHECK_URL,
        timeout: 120000,
        reuseExistingServer: !process.env.CI,
        env: SERVER_ENV
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
