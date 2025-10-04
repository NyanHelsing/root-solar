import { LogLevel, type LogLevelType, Logger, createLogger } from "@catsle/caretta";

const APP_NAMESPACE = "root-solar";

const toDefinedEntries = (metadata: Record<string, unknown>) =>
    Object.entries(metadata).filter(([, value]) => typeof value !== "undefined");

const applyMetadata = (
    setter: (key: string, value: unknown) => void,
    metadata: Record<string, unknown>,
) => {
    for (const [key, value] of toDefinedEntries(metadata)) {
        setter(key, value);
    }
};

export interface InitializeObservabilityOptions {
    level?: LogLevelType;
    metadata?: Record<string, unknown>;
}

export const initializeObservability = ({
    level = LogLevel.INFO,
    metadata = {},
}: InitializeObservabilityOptions = {}): LogLevelType => {
    Logger.setGlobalLevel(level);

    applyMetadata(Logger.setGlobalMetadata, {
        app: APP_NAMESPACE,
        logLevel: LogLevel.getName(level),
        ...metadata,
    });

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

    applyMetadata((key, value) => logger.setMetadata(key, value), {
        ...(tags?.length ? { tags } : {}),
        ...metadata,
    });

    return logger;
};

export { Logger, LogLevel } from "@catsle/caretta";
export type { LogLevelType } from "@catsle/caretta";
export type AppLogger = ReturnType<typeof createAppLogger>;

const levelByName: Record<string, LogLevelType> = {
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
    WARN: LogLevel.WARN,
    ERROR: LogLevel.ERROR,
    ALWAYS: LogLevel.ALWAYS,
};

export const parseLogLevel = (value?: string) => levelByName[value?.trim().toUpperCase() ?? ""];
