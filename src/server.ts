import {
    LogLevel,
    createAppLogger,
    initializeObservability,
    parseLogLevel,
} from "@root-solar/observability";
import { startServer } from "@root-solar/server";

const environment = process.env.NODE_ENV ?? "development";
const desiredLevel =
    parseLogLevel(process.env.LOG_LEVEL) ??
    (environment === "development" ? LogLevel.DEBUG : LogLevel.INFO);

const resolvedLevel = initializeObservability({
    level: desiredLevel,
    metadata: {
        environment,
        platform: "node",
    },
});
const bootstrapLogger = createAppLogger("server:bootstrap", {
    tags: ["server", "startup"],
});

bootstrapLogger.info("Starting server bootstrap", {
    logLevel: LogLevel.getName(resolvedLevel),
});

void startServer();
