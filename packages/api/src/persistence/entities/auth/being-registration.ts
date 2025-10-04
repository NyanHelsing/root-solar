import { RecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import type {
    BeingRegistrationChallengeRecord,
    BeingRegistrationStore
} from "@root-solar/auth/procedures";

import type { Context } from "../../../context.ts";

const challengeLogger = createAppLogger("persistence:auth-challenge", {
    tags: ["persistence", "auth", "challenge"]
});

const TABLE = "auth_challenge" as const;

type StoredChallengeRecord = BeingRegistrationChallengeRecord & {
    id: string;
    status: "pending" | "completed";
};

const toRecordId = (challengeId: string) => new RecordId(TABLE, challengeId);

const unwrapSingle = <T>(value: T | T[] | null): T | null => {
    if (value === null) {
        return null;
    }
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value;
};

const toChallengeRecord = (stored: StoredChallengeRecord): BeingRegistrationChallengeRecord => {
    const { id: _id, status: _status, ...rest } = stored;
    return rest;
};

export const createBeingRegistrationStore = (ctx: Context): BeingRegistrationStore => {
    return {
        async persistChallenge(record) {
            const recordId = toRecordId(record.challengeId);
            challengeLogger.debug("Persisting auth challenge", {
                challengeId: record.challengeId,
                beingName: record.beingName,
                tags: ["mutation", "auth", "challenge"]
            });
            await ctx.db.upsert<StoredChallengeRecord>(recordId, {
                ...record,
                id: record.challengeId,
                status: "pending"
            });
            challengeLogger.info("Auth challenge stored", {
                challengeId: record.challengeId,
                tags: ["mutation", "auth", "challenge"]
            });
        },
        async loadChallenge(challengeId) {
            challengeLogger.debug("Loading auth challenge", {
                challengeId,
                tags: ["query", "auth", "challenge"]
            });
            const stored = await ctx.db.select<StoredChallengeRecord>(toRecordId(challengeId));
            const record = unwrapSingle(stored);
            if (!record) {
                challengeLogger.debug("Auth challenge not found", {
                    challengeId,
                    tags: ["query", "auth", "challenge"]
                });
                return null;
            }
            if (record.status !== "pending") {
                challengeLogger.debug("Auth challenge is not pending", {
                    challengeId,
                    status: record.status,
                    tags: ["query", "auth", "challenge"]
                });
                return null;
            }
            challengeLogger.debug("Auth challenge loaded", {
                challengeId,
                tags: ["query", "auth", "challenge"]
            });
            return toChallengeRecord(record);
        },
        async completeChallenge(challengeId) {
            challengeLogger.debug("Completing auth challenge", {
                challengeId,
                tags: ["mutation", "auth", "challenge"]
            });
            await ctx.db.delete(toRecordId(challengeId));
            challengeLogger.info("Auth challenge completed", {
                challengeId,
                tags: ["mutation", "auth", "challenge"]
            });
        }
    } satisfies BeingRegistrationStore;
};
