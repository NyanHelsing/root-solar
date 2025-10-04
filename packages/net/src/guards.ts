import type { SentimentFraction, SentimentResponse } from "./types.ts";

export const isSentimentFraction = (value: unknown): value is SentimentFraction => {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.numerator === "number" &&
        Number.isFinite(candidate.numerator) &&
        typeof candidate.denominator === "number" &&
        Number.isFinite(candidate.denominator)
    );
};

export const isSentimentResponse = (value: unknown): value is SentimentResponse => {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value as Record<string, unknown>;
    if (candidate.status === "ok") {
        return typeof candidate.recordId === "string" && isSentimentFraction(candidate.fraction);
    }
    if (candidate.status === "not_found") {
        return typeof candidate.recordId === "string";
    }
    return candidate.status === "error" && typeof candidate.message === "string";
};
