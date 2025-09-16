import { RecordId } from "surrealdb";

import type { Context } from "../../../context.ts";

const SENTIMENT_TABLE = "sentiment" as const;
const BEING_TABLE = "being" as const;

export type SentimentRecord = {
  id: string;
  beingId: number;
  axiomId: number;
  type: string;
  weight: number;
};

export type SentimentAllocation = SentimentRecord & {
  totalWeightForType: number;
  ratio: number;
  maxWeight?: number;
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
  { beingId, type }: { beingId: number; type?: string },
) => {
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

  const [queryResult] = await ctx.db.query<[
    (SentimentRecord[] | null)?,
  ]>(statement, params);

  if (!queryResult || queryResult.status !== "OK") {
    return [] as SentimentRecord[];
  }

  const records = queryResult.result;
  if (!Array.isArray(records)) {
    return [] as SentimentRecord[];
  }

  return records;
};

const ensureBeingExists = async (ctx: Context, beingId: number) => {
  const record = await ctx.db.select(
    new RecordId(BEING_TABLE, beingId),
  );
  const being = unwrapSingle(record);
  if (!being) {
    throw new Error(`Being ${beingId} does not exist`);
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
      beingId: number;
      axiomId: number;
      type: string;
      weight: number;
      maxWeight?: number;
    }) {
      assertInteger(beingId, "beingId");
      assertInteger(axiomId, "axiomId");
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
        await ctx.db.delete(new RecordId(SENTIMENT_TABLE, sentimentId));
        return null;
      }

      const record = await ctx.db.upsert<SentimentRecord>(
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
        return null;
      }

      const ratio = newTotalWeight === 0 ? 0 : weight / newTotalWeight;

      return {
        ...stored,
        totalWeightForType: newTotalWeight,
        ratio,
        maxWeight,
      } satisfies SentimentAllocation;
    },
    async listForBeing(beingId: number, options?: { type?: string }) {
      assertInteger(beingId, "beingId");
      const sentiments = await selectSentiments(ctx, {
        beingId,
        type: options?.type,
      });
      if (sentiments.length === 0) {
        return [] as SentimentAllocation[];
      }

      const totals = sentiments.reduce((acc, sentiment) => {
        acc.set(
          sentiment.type,
          (acc.get(sentiment.type) ?? 0) + sentiment.weight,
        );
        return acc;
      }, new Map<string, number>());

      return sentiments.map((sentiment) => {
        const totalWeightForType = totals.get(sentiment.type) ?? 0;
        const ratio = totalWeightForType === 0
          ? 0
          : sentiment.weight / totalWeightForType;
        return {
          ...sentiment,
          totalWeightForType,
          ratio,
        } satisfies SentimentAllocation;
      });
    },
    async remove({
      beingId,
      axiomId,
      type,
    }: {
      beingId: number;
      axiomId: number;
      type: string;
    }) {
      assertInteger(beingId, "beingId");
      assertInteger(axiomId, "axiomId");
      await ctx.db.delete(
        new RecordId(SENTIMENT_TABLE, `${beingId}:${type}:${axiomId}`),
      );
    },
  } satisfies {
    upsert: (input: {
      beingId: number;
      axiomId: number;
      type: string;
      weight: number;
      maxWeight?: number;
    }) => Promise<SentimentAllocation | null>;
    listForBeing: (
      beingId: number,
      options?: { type?: string },
    ) => Promise<SentimentAllocation[]>;
    remove: (input: {
      beingId: number;
      axiomId: number;
      type: string;
    }) => Promise<void>;
  };
};
