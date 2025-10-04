#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const coverageDir = path.join(projectRoot, "coverage", "unit");

await mkdir(coverageDir, { recursive: true });

const userArgs = process.argv.slice(2);
const defaultPatterns = ["src/**/*.unit.test.ts", "packages/**/src/**/*.unit.test.ts"];

const testPatterns = userArgs.length > 0 ? userArgs : defaultPatterns;

const nodeArgs = [
    "--experimental-strip-types",
    "--test",
    "--experimental-test-module-mocks",
    "--experimental-test-coverage",
    "--test-coverage-include=src/**/*.ts",
    "--test-coverage-include=packages/**/src/**/*.ts",
    "--test-coverage-exclude=**/*.unit.test.ts",
    "--test-coverage-exclude=**/*.integration.test.ts",
    "--test-coverage-exclude=**/__tests__/**",
    ...testPatterns,
];

const child = spawn(process.execPath, nodeArgs, {
    stdio: "inherit",
    env: {
        ...process.env,
        NODE_V8_COVERAGE: coverageDir,
    },
});

child.once("close", (code) => {
    process.exit(code ?? 0);
});

child.once("error", (error) => {
    console.error(error);
    process.exit(1);
});
