import { LogLevel, type LogLevelType, Logger, createLogger } from "@catsle/caretta";

const APP_NAMESPACE = "root-solar";

export interface InitializeObservabilityOptions {
  level?: LogLevelType;
  metadata?: Record<string, unknown>;
}

export const initializeObservability = ({
  level = LogLevel.INFO,
  metadata = {},
}: InitializeObservabilityOptions = {}): LogLevelType => {
  Logger.setGlobalLevel(level);

  const combinedMetadata = {
    app: APP_NAMESPACE,
    logLevel: LogLevel.getName(level),
    ...metadata,
  } satisfies Record<string, unknown>;

  for (const [key, value] of Object.entries(combinedMetadata)) {
    if (typeof value !== "undefined") {
      Logger.setGlobalMetadata(key, value);
    }
  }

  return level;
};

export interface CreateLoggerOptions {
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export const createAppLogger = (
  context: string,
  { tags, metadata = {} }: CreateLoggerOptions = {},
) => {
  const scopedContext = context.startsWith(APP_NAMESPACE)
    ? context
    : `${APP_NAMESPACE}:${context}`;
  const logger = createLogger(scopedContext);

  if (tags?.length) {
    logger.setMetadata("tags", tags);
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value !== "undefined") {
      logger.setMetadata(key, value);
    }
  }

  return logger;
};

export { Logger, LogLevel } from "@catsle/caretta";
export type { LogLevelType } from "@catsle/caretta";
export type AppLogger = ReturnType<typeof createAppLogger>;

export const parseLogLevel = (value?: string): LogLevelType | undefined => {
  if (!value) {
    return undefined;
  }

  switch (value.trim().toUpperCase()) {
    case "DEBUG":
      return LogLevel.DEBUG;
    case "INFO":
      return LogLevel.INFO;
    case "WARN":
      return LogLevel.WARN;
    case "ERROR":
      return LogLevel.ERROR;
    case "ALWAYS":
      return LogLevel.ALWAYS;
    default:
      return undefined;
  }
};
