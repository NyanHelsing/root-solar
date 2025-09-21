import { RecordId, StringRecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import type { Context } from "../../../context.ts";

const sentimentLogger = createAppLogger("persistence:sentiment", {
  tags: ["persistence", "sentiment"],
});

const SENTIMENT_TABLE = "sentiment" as const;
const BEING_TABLE = "being" as const;

const BOOLEAN_SENTIMENT_TYPES = new Set<string>([
  "vision",
  "initiative",
  "epic",
  "story",
  "axiomatic",
]);

export type SentimentRecord = {
  id: string;
  beingId: string;
  missiveId: string;
  /**
   * @deprecated legacy alias retained for compatibility
   */
  axiomId: string;
  type: string;
  weight: number;
};

export type SentimentAllocation = SentimentRecord & {
  totalWeightForType: number;
  ratio: number;
  maxWeight?: number;
};

type RawSentimentRecord = {
  id: string | RecordId;
  beingId: string | number;
  missiveId?: string | number;
  axiomId?: string | number;
  type: string;
  weight: number;
};

const normalizeId = (value: string | number | RecordId | undefined | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return value.toString();
};

const extractMissiveId = (record: RawSentimentRecord): string => {
  const direct = normalizeId(record.missiveId ?? record.axiomId);
  if (direct && direct.length > 0) {
    return direct;
  }
  const rawId = normalizeId(record.id);
  if (rawId) {
    const parts = rawId.split(":");
    if (parts.length >= 4) {
      // sentiment id shape: beingId:type:missiveId...
      const candidate = parts.slice(3).join(":");
      if (candidate.length > 0) {
        return candidate.startsWith("missive:") ? candidate : `missive:${candidate}`;
      }
    }
  }
  throw new Error("Unable to determine missiveId from sentiment record");
};

const toSentimentRecord = (record: RawSentimentRecord): SentimentRecord => {
  const missiveId = extractMissiveId(record);
  const id = normalizeId(record.id);
  const beingId = normalizeId(record.beingId);
  if (!id || !beingId) {
    throw new Error("Sentiment record missing identifier");
  }
  return {
    id,
    beingId,
    missiveId,
    axiomId: missiveId,
    type: record.type,
    weight: record.weight,
  } satisfies SentimentRecord;
};

const unwrapSingle = <T>(value: T | T[] | null): T | null => {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
};

const selectSentiments = async (
  ctx: Context,
  { beingId, type }: { beingId: string; type?: string },
) => {
  sentimentLogger.debug("Selecting sentiments", {
    beingId,
    type,
    tags: ["query"],
  });
  const statement = type
    ? "SELECT * FROM type::table($table) WHERE beingId = $beingId AND type = $type"
    : "SELECT * FROM type::table($table) WHERE beingId = $beingId";

  const params: Record<string, unknown> = {
    table: SENTIMENT_TABLE,
    beingId,
  };
  if (type !== undefined) {
    params.type = type;
  }

  const [rawResult] = await ctx.db.query(statement, params);

  if (!rawResult) {
    sentimentLogger.warn("Sentiment selection query failed", {
      beingId,
      type,
      status: "EMPTY_RESULT",
      tags: ["query"],
    });
    return [] as SentimentRecord[];
  }

  const extractRecords = (): RawSentimentRecord[] | null => {
    if (Array.isArray(rawResult)) {
      return rawResult as RawSentimentRecord[];
    }
    if (typeof rawResult === "object" && rawResult !== null) {
      const status = (rawResult as { status?: string }).status;
      if (status && status !== "OK") {
        sentimentLogger.warn("Sentiment selection query failed", {
          beingId,
          type,
          status,
          tags: ["query"],
        });
        return null;
      }
      const result = (rawResult as { result?: unknown }).result;
      if (Array.isArray(result)) {
        return result as RawSentimentRecord[];
      }
      sentimentLogger.warn("Unexpected sentiment query result shape", {
        beingId,
        type,
        tags: ["query"],
      });
      return null;
    }
    sentimentLogger.warn("Unhandled sentiment query result shape", {
      beingId,
      type,
      tags: ["query"],
    });
    return null;
  };

  const records = extractRecords();
  if (!records) {
    return [] as SentimentRecord[];
  }

  const mapped = records.map(toSentimentRecord);
  sentimentLogger.debug("Sentiments selected", {
    beingId,
    type,
    count: mapped.length,
    tags: ["query"],
  });
  return mapped;
};

const ensureBeingExists = async (ctx: Context, beingId: string) => {
  const record = await ctx.db.select(new StringRecordId(beingId));
  const being = unwrapSingle(record);
  if (!being) {
    sentimentLogger.warn("Being missing during sentiment operation; creating", {
      beingId,
      tags: ["mutation", "being"],
    });
    return await ctx.beings.create({ name: "superuser" });
  }
};

const assertInteger = (value: number, field: string) => {
  if (!Number.isInteger(value)) {
    throw new Error(`${field} must be an integer`);
  }
};

const normalizeMissiveId = (missiveId: string) => {
  if (missiveId.includes(":")) {
    return missiveId;
  }
  return `missive:${missiveId}`;
};

export type SentimentModel = ReturnType<typeof createSentimentModel>;

export const createSentimentModel = (ctx: Context) => {
  return {
    async upsert({
      beingId,
      missiveId,
      type,
      weight,
      maxWeight,
    }: {
      beingId: string;
      missiveId: string;
      type: string;
      weight: number;
      maxWeight?: number;
    }) {
      const normalizedMissiveId = normalizeMissiveId(missiveId);
      const isBooleanSentiment = BOOLEAN_SENTIMENT_TYPES.has(type);

      sentimentLogger.debug("Upserting sentiment", {
        beingId,
        missiveId: normalizedMissiveId,
        type,
        weight,
        maxWeight,
        tags: ["mutation", "upsert"],
      });

      assertInteger(weight, "weight");
      if (weight < 0) {
        throw new Error("weight must be non-negative");
      }
      if (isBooleanSentiment && weight > 1) {
        throw new Error(`Boolean sentiment ${type} must be 0 or 1`);
      }
      if (maxWeight !== undefined) {
        assertInteger(maxWeight, "maxWeight");
        if (maxWeight < 0) {
          throw new Error("maxWeight must be non-negative");
        }
      }

      await ensureBeingExists(ctx, beingId);

      const sentimentId = `${beingId}:${type}:${normalizedMissiveId}`;
      const effectiveMaxWeight = isBooleanSentiment ? 1 : maxWeight;
      const existingForType = await selectSentiments(ctx, { beingId, type });
      const otherWeightTotal = existingForType.reduce((total, record) => {
        if (record.id === sentimentId) {
          return total;
        }
        return total + record.weight;
      }, 0);
      const newTotalWeight = otherWeightTotal + weight;

      if (effectiveMaxWeight !== undefined && newTotalWeight > effectiveMaxWeight) {
        throw new Error(
          `Sentiment type ${type} for being ${beingId} exceeds allocation of ${effectiveMaxWeight} (attempted ${newTotalWeight})`,
        );
      }

      if (weight === 0) {
        sentimentLogger.debug("Weight is zero; deleting sentiment record", {
          beingId,
          missiveId: normalizedMissiveId,
          type,
          tags: ["mutation", "upsert"],
        });
        await ctx.db.delete(new RecordId(SENTIMENT_TABLE, sentimentId));
        sentimentLogger.info("Sentiment removed due to zero weight", {
          beingId,
          missiveId: normalizedMissiveId,
          type,
          tags: ["mutation", "upsert"],
        });
        return null;
      }

      const record = await ctx.db.upsert<RawSentimentRecord>(
        new RecordId(SENTIMENT_TABLE, sentimentId),
        {
          id: sentimentId,
          beingId,
          missiveId: normalizedMissiveId,
          axiomId: normalizedMissiveId,
          type,
          weight,
        },
      );
      const stored = unwrapSingle(record);
      if (!stored) {
        sentimentLogger.warn("Upsert returned empty record", {
          beingId,
          missiveId: normalizedMissiveId,
          type,
          tags: ["mutation", "upsert"],
        });
        return null;
      }

      const ratio = newTotalWeight === 0 ? 0 : weight / newTotalWeight;

      const allocation = {
        ...toSentimentRecord(stored),
        totalWeightForType: newTotalWeight,
        ratio,
        maxWeight: effectiveMaxWeight,
      } satisfies SentimentAllocation;
      sentimentLogger.info("Sentiment upserted", {
        beingId,
        missiveId: normalizedMissiveId,
        type,
        weight,
        totalWeightForType: newTotalWeight,
        tags: ["mutation", "upsert"],
      });
      return allocation;
    },
    async listForBeing(beingId: string, options?: { type?: string }) {
      sentimentLogger.debug("Listing sentiments for being", {
        beingId,
        type: options?.type,
        tags: ["query"],
      });

      const sentiments = await selectSentiments(ctx, {
        beingId,
        type: options?.type,
      });

      if (sentiments.length === 0) {
        sentimentLogger.debug("No sentiments found", {
          beingId,
          type: options?.type,
          tags: ["query"],
        });
        return [] as SentimentAllocation[];
      }

      const totals = sentiments.reduce((acc, sentiment) => {
        acc.set(
          sentiment.type,
          (acc.get(sentiment.type) ?? 0) + sentiment.weight,
        );
        return acc;
      }, new Map<string, number>());

      const allocations = sentiments.map((sentiment) => {
        const totalWeightForType = totals.get(sentiment.type) ?? 0;
        const ratio =
          totalWeightForType === 0 ? 0 : sentiment.weight / totalWeightForType;
        return {
          ...sentiment,
          totalWeightForType,
          ratio,
          maxWeight: BOOLEAN_SENTIMENT_TYPES.has(sentiment.type) ? 1 : undefined,
        } satisfies SentimentAllocation;
      });

      sentimentLogger.debug("Sentiments listed", {
        beingId,
        count: allocations.length,
        type: options?.type,
        tags: ["query"],
      });
      return allocations;
    },
    async remove({
      beingId,
      missiveId,
      type,
    }: {
      beingId: string;
      missiveId: string;
      type: string;
    }) {
      const normalizedMissiveId = normalizeMissiveId(missiveId);
      sentimentLogger.debug("Removing sentiment", {
        beingId,
        missiveId: normalizedMissiveId,
        type,
        tags: ["mutation", "remove"],
      });
      await ctx.db.delete(
        new RecordId(SENTIMENT_TABLE, `${beingId}:${type}:${normalizedMissiveId}`),
      );
      sentimentLogger.info("Sentiment removed", {
        beingId,
        missiveId: normalizedMissiveId,
        type,
        tags: ["mutation", "remove"],
      });
    },
  } satisfies {
    upsert: (input: {
      beingId: string;
      missiveId: string;
      type: string;
      weight: number;
      maxWeight?: number;
    }) => Promise<SentimentAllocation | null>;
    listForBeing: (
      beingId: string,
      options?: { type?: string },
    ) => Promise<SentimentAllocation[]>;
    remove: (input: {
      beingId: string;
      missiveId: string;
      type: string;
    }) => Promise<void>;
  };
};
