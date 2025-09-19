import { LogLevel, type LogLevelType, Logger, createLogger } from "@catsle/caretta";

const LEVEL_LOOKUP: Record<string, LogLevelType> = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR,
  ALWAYS: LogLevel.ALWAYS,
};

const APP_NAMESPACE = "root-solar";

export interface LoggingMetadata {
  tags?: string[];
  [key: string]: unknown;
}

export interface InitializeLoggingOptions {
  level?: LogLevelType | keyof typeof LEVEL_LOOKUP | string;
  metadata?: LoggingMetadata;
}

const getProcessEnv = (key: string): string | undefined => {
  if (typeof process !== "undefined" && typeof process.env?.[key] === "string") {
    return process.env[key];
  }
  return undefined;
};

const detectPlatform = (): "browser" | "node" | "unknown" => {
  if (typeof window !== "undefined" && typeof window.document !== "undefined") {
    return "browser";
  }
  if (typeof process !== "undefined" && process.release?.name === "node") {
    return "node";
  }
  return "unknown";
};

const toLogLevel = (candidate?: InitializeLoggingOptions["level"]): LogLevelType | undefined => {
  if (!candidate) {
    return undefined;
  }

  if (typeof candidate !== "string") {
    return candidate;
  }

  const normalised = candidate.trim().toUpperCase();
  if (normalised in LEVEL_LOOKUP) {
    return LEVEL_LOOKUP[normalised];
  }
  return undefined;
};

const determineDefaultLevel = (): LogLevelType => {
  const envLevel = toLogLevel(getProcessEnv("LOG_LEVEL"));
  if (envLevel) {
    return envLevel;
  }

  const envName = getProcessEnv("NODE_ENV") ?? "development";
  return envName === "development" ? LogLevel.DEBUG : LogLevel.INFO;
};

export const initializeLogging = ({
  level,
  metadata,
}: InitializeLoggingOptions = {}): LogLevelType => {
  const resolvedLevel = toLogLevel(level) ?? determineDefaultLevel();
  Logger.setGlobalLevel(resolvedLevel);

  const environment = getProcessEnv("NODE_ENV") ?? "development";

  Logger.setGlobalMetadata("app", APP_NAMESPACE);
  Logger.setGlobalMetadata("environment", environment);
  Logger.setGlobalMetadata("platform", detectPlatform());
  Logger.setGlobalMetadata("logLevel", LogLevel.getName(resolvedLevel));

  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value !== "undefined") {
        Logger.setGlobalMetadata(key, value);
      }
    }
  }

  return resolvedLevel;
};

export interface CreateAppLoggerOptions extends LoggingMetadata {}

export const createAppLogger = (
  context: string,
  options: CreateAppLoggerOptions = {},
) => {
  const scopedContext = context.startsWith(APP_NAMESPACE)
    ? context
    : `${APP_NAMESPACE}:${context}`;
  const logger = createLogger(scopedContext);

  if (options.tags?.length) {
    logger.setMetadata("tags", options.tags);
  }

  for (const [key, value] of Object.entries(options)) {
    if (key === "tags") {
      continue;
    }
    if (typeof value !== "undefined") {
      logger.setMetadata(key, value);
    }
  }

  return logger;
};

export type AppLogger = ReturnType<typeof createAppLogger>;
