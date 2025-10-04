import { spawnSync } from "node:child_process";

const buildHarness = () => {
    const result = spawnSync(
        "pnpm",
        ["rsbuild", "build", "--config", "packages/testing/rsbuild.config.ts"],
        { stdio: "inherit", env: process.env }
    );

    if (result.status !== 0) {
        throw new Error("Failed to build component harness before Playwright tests");
    }
};

export default async () => {
    if (process.env.PLAYWRIGHT_SKIP_HARNESS_BUILD !== "1") {
        buildHarness();
    }
};
