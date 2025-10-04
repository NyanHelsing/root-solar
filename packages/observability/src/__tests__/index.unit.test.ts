import assert from "node:assert/strict";
import { describe, it } from "node:test";

const moduleSpecifier = "../index.ts";

describe("observability", () => {
    it("initializes global logging metadata and creates scoped loggers", async () => {
        const { initializeObservability, createAppLogger, LogLevel, Logger } = await import(
            `${moduleSpecifier}?case=${Date.now()}`
        );

        const originalLevel = Logger.globalLogLevel;
        const originalMetadata = { ...Logger.globalMetadata };

        try {
            Logger.reset();

            const level = initializeObservability({
                level: LogLevel.DEBUG,
                metadata: { region: "test" }
            });

            assert.equal(level, LogLevel.DEBUG);
            assert.equal(Logger.globalLogLevel, LogLevel.DEBUG);
            assert.equal(Logger.globalMetadata.app, "root-solar");
            assert.equal(Logger.globalMetadata.logLevel, LogLevel.getName(LogLevel.DEBUG));
            assert.equal(Logger.globalMetadata.region, "test");

            const logger = createAppLogger("api", {
                tags: ["test", "logger"],
                metadata: { component: "unit" }
            });

            assert.equal(logger.context, "root-solar:api");
            assert.deepEqual(logger.metadata.tags, ["test", "logger"]);
            assert.equal(logger.metadata.component, "unit");
        } finally {
            Logger.reset();
            Logger.globalLogLevel = originalLevel;
            Logger.globalMetadata = { ...originalMetadata };
        }
    });
});
