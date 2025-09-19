import { RecordId, StringRecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import type { Context } from "../../../context.ts";

const sentimentLogger = createAppLogger("persistence:sentiment", {
  tags: ["persistence", "sentiment"],
});

const SENTIMENT_TABLE = "sentiment" as const;
const BEING_TABLE = "being" as const;

export type SentimentRecord = {
  id: string;
  beingId: string;
  axiomId: string;
  type: string;
  weight: number;
};

export type SentimentAllocation = SentimentRecord & {
  totalWeightForType: number;
  ratio: number;
  maxWeight?: number;
};

type RawSentimentRecord = Omit<
  SentimentRecord,
  "id" | "beingId" | "axiomId"
> & {
  id: string | RecordId;
  beingId: string | number;
  axiomId: string | number;
};

const toSentimentRecord = (record: RawSentimentRecord): SentimentRecord => ({
  ...record,
  id: typeof record.id === "string" ? record.id : record.id.toString(),
  beingId:
    typeof record.beingId === "string"
      ? record.beingId
      : record.beingId.toString(),
  axiomId:
    typeof record.axiomId === "string"
      ? record.axiomId
      : record.axiomId.toString(),
});

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

  const [queryResult] = await ctx.db.query<[(RawSentimentRecord[] | null)?]>(
    statement,
    params,
  );

  if (!queryResult || queryResult.status !== "OK") {
    sentimentLogger.warn("Sentiment selection query failed", {
      beingId,
      type,
      status: queryResult?.status,
      tags: ["query"],
    });
    return [] as SentimentRecord[];
  }

  const records = queryResult.result;
  if (!Array.isArray(records)) {
    sentimentLogger.warn("Unexpected sentiment query result shape", {
      beingId,
      type,
      tags: ["query"],
    });
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

export type SentimentModel = ReturnType<typeof createSentimentModel>;

export const createSentimentModel = (ctx: Context) => {
  return {
    async upsert({
      beingId,
      axiomId,
      type,
      weight,
      maxWeight,
    }: {
      beingId: string;
      axiomId: string;
      type: string;
      weight: number;
      maxWeight?: number;
    }) {
      sentimentLogger.debug("Upserting sentiment", {
        beingId,
        axiomId,
        type,
        weight,
        maxWeight,
        tags: ["mutation", "upsert"],
      });

      assertInteger(weight, "weight");
      if (weight < 0) {
        throw new Error("weight must be non-negative");
      }
      if (maxWeight !== undefined) {
        assertInteger(maxWeight, "maxWeight");
        if (maxWeight < 0) {
          throw new Error("maxWeight must be non-negative");
        }
      }

      await ensureBeingExists(ctx, beingId);

      const sentimentId = `${beingId}:${type}:${axiomId}`;
      const existingForType = await selectSentiments(ctx, { beingId, type });
      const otherWeightTotal = existingForType.reduce((total, record) => {
        if (record.id === sentimentId) {
          return total;
        }
        return total + record.weight;
      }, 0);
      const newTotalWeight = otherWeightTotal + weight;

      if (maxWeight !== undefined && newTotalWeight > maxWeight) {
        throw new Error(
          `Sentiment type ${type} for being ${beingId} exceeds allocation of ${maxWeight} (attempted ${newTotalWeight})`,
        );
      }

      if (weight === 0) {
        sentimentLogger.debug("Weight is zero; deleting sentiment record", {
          beingId,
          axiomId,
          type,
          tags: ["mutation", "upsert"],
        });
        await ctx.db.delete(new RecordId(SENTIMENT_TABLE, sentimentId));
        sentimentLogger.info("Sentiment removed due to zero weight", {
          beingId,
          axiomId,
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
          axiomId,
          type,
          weight,
        },
      );
      const stored = unwrapSingle(record);
      if (!stored) {
        sentimentLogger.warn("Upsert returned empty record", {
          beingId,
          axiomId,
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
        maxWeight,
      } satisfies SentimentAllocation;
      sentimentLogger.info("Sentiment upserted", {
        beingId,
        axiomId,
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
      //const sentiments = await selectSentiments(ctx, {
      //  beingId,
      //  type: options?.type,
      //});
      const [sentiments] = await ctx.db.query<[SentimentAllocation[]]>(
        `SELECT * FROM ${SENTIMENT_TABLE} WHERE beingId = $beingId`,
        { beingId },
      );
      if (!Array.isArray(sentiments)) {
        sentimentLogger.warn("Unexpected sentiments result from listForBeing", {
          beingId,
          tags: ["query"],
        });
        return [] as SentimentAllocation[];
      }
      if (sentiments.length === 0) {
        sentimentLogger.debug("No sentiments found", {
          beingId,
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
      axiomId,
      type,
    }: {
      beingId: string;
      axiomId: string;
      type: string;
    }) {
      sentimentLogger.debug("Removing sentiment", {
        beingId,
        axiomId,
        type,
        tags: ["mutation", "remove"],
      });
      await ctx.db.delete(
        new RecordId(SENTIMENT_TABLE, `${beingId}:${type}:${axiomId}`),
      );
      sentimentLogger.info("Sentiment removed", {
        beingId,
        axiomId,
        type,
        tags: ["mutation", "remove"],
      });
    },
  } satisfies {
    upsert: (input: {
      beingId: string;
      axiomId: string;
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
      axiomId: string;
      type: string;
    }) => Promise<void>;
  };
};
