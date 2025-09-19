import { LogLevel } from "@catsle/caretta";

import { createAppLogger, initializeLogging } from "./logging/index.ts";
import { startServer } from "./server/index.ts";

const resolvedLevel = initializeLogging();
const bootstrapLogger = createAppLogger("server:bootstrap", {
  tags: ["server", "startup"],
});

bootstrapLogger.info("Starting server bootstrap", {
  logLevel: LogLevel.getName(resolvedLevel),
});

void startServer();
