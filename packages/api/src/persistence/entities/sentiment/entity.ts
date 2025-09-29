import { RecordId, StringRecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import type { Context } from "../../../context.ts";
import type { TagRecord } from "../index.ts";

const sentimentLogger = createAppLogger("persistence:sentiment", {
  tags: ["persistence", "sentiment"],
});

const SENTIMENT_TABLE = "sentiment" as const;

export type SentimentRecord = {
  id: string;
  beingId: string;
  subjectTable: string;
  subjectId: string;
  tagId: string;
  weight: number;
};

export type SentimentAllocation = SentimentRecord & {
  totalWeightForTag: number;
  ratio: number;
  maxWeight?: number;
  tag?: TagRecord;
};

type RawSentimentRecord = Omit<
  SentimentRecord,
  "id" | "beingId" | "subjectId"
> & {
  id: string | RecordId;
  beingId: string | number;
  subjectId: string | number;
};

const toSentimentRecord = (record: RawSentimentRecord): SentimentRecord => ({
  ...record,
  id: typeof record.id === "string" ? record.id : record.id.toString(),
  beingId:
    typeof record.beingId === "string"
      ? record.beingId
      : record.beingId.toString(),
  subjectId:
    typeof record.subjectId === "string"
      ? record.subjectId
      : record.subjectId.toString(),
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
  {
    beingId,
    tagId,
    subjectTable = "missive",
  }: { beingId: string; tagId?: string; subjectTable?: string },
) => {
  sentimentLogger.debug("Selecting sentiments", {
    beingId,
    tagId,
    subjectTable,
    tags: ["query"],
  });
  const statement = tagId
    ? "SELECT * FROM type::table($table) WHERE beingId = $beingId AND tagId = $tagId AND subjectTable = $subjectTable"
    : "SELECT * FROM type::table($table) WHERE beingId = $beingId AND subjectTable = $subjectTable";

  const params: Record<string, unknown> = {
    table: SENTIMENT_TABLE,
    beingId,
    subjectTable,
  } satisfies Record<string, unknown>;
  if (tagId) {
    params.tagId = tagId;
  }

  const [rawResult] = await ctx.db.query(statement, params);

  if (!rawResult) {
    sentimentLogger.warn("Sentiment selection query failed", {
      beingId,
      tagId,
      subjectTable,
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
          tagId,
          subjectTable,
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
        tagId,
        subjectTable,
        tags: ["query"],
      });
      return null;
    }
    sentimentLogger.warn("Unhandled sentiment query result shape", {
      beingId,
      tagId,
      subjectTable,
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
    tagId,
    subjectTable,
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

const ensureTagExists = async (ctx: Context, tagId: string) => {
  const existing = await ctx.tags.get(tagId);
  if (existing) {
    return existing;
  }
  const slug = tagId.includes(":") ? tagId.split(":").slice(1).join(":") : tagId;
  const label = slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const created = await ctx.tags.upsert({
    slug,
    label,
    tags: ["tag:sentimental"],
  });
  if (!created) {
    throw new Error(`Failed to ensure tag ${tagId} exists`);
  }
  return created;
};

const assertInteger = (value: number, field: string) => {
  if (!Number.isInteger(value)) {
    throw new Error(`${field} must be an integer`);
  }
};

const hydrateSentiments = async (
  ctx: Context,
  records: SentimentRecord[],
): Promise<SentimentAllocation[]> => {
  if (records.length === 0) {
    return [];
  }
  const tagIds = Array.from(new Set(records.map((record) => record.tagId)));
  const tags = await ctx.tags.getMany(tagIds);
  const lookup = new Map(tags.map((tag) => [tag.id, tag]));
  return records.map((record) => ({
    ...record,
    tag: lookup.get(record.tagId),
    totalWeightForTag: 0,
    ratio: 0,
  } satisfies SentimentAllocation));
};

export type SentimentModel = ReturnType<typeof createSentimentModel>;

export const createSentimentModel = (ctx: Context) => {
  return {
    async upsert({
      beingId,
      subjectId,
      subjectTable = "missive",
      tagId,
      weight,
      maxWeight,
    }: {
      beingId: string;
      subjectId: string;
      subjectTable?: string;
      tagId: string;
      weight: number;
      maxWeight?: number;
    }) {
      sentimentLogger.debug("Upserting sentiment", {
        beingId,
        subjectId,
        subjectTable,
        tagId,
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
      await ensureTagExists(ctx, tagId);

      const sentimentId = `${beingId}:${tagId}:${subjectTable}:${subjectId}`;
      const existingForTag = await selectSentiments(ctx, {
        beingId,
        tagId,
        subjectTable,
      });
      const otherWeightTotal = existingForTag.reduce((total, record) => {
        if (record.id === sentimentId) {
          return total;
        }
        return total + record.weight;
      }, 0);
      const newTotalWeight = otherWeightTotal + weight;

      if (maxWeight !== undefined && newTotalWeight > maxWeight) {
        throw new Error(
          `Sentiment tag ${tagId} for being ${beingId} exceeds allocation of ${maxWeight} (attempted ${newTotalWeight})`,
        );
      }

      if (weight === 0) {
        sentimentLogger.debug("Weight is zero; deleting sentiment record", {
          beingId,
          subjectId,
          subjectTable,
          tagId,
          tags: ["mutation", "upsert"],
        });
        await ctx.db.delete(new RecordId(SENTIMENT_TABLE, sentimentId));
        sentimentLogger.info("Sentiment removed due to zero weight", {
          beingId,
          subjectId,
          subjectTable,
          tagId,
          tags: ["mutation", "upsert"],
        });
        return null;
      }

      const record = await ctx.db.upsert<RawSentimentRecord>(
        new RecordId(SENTIMENT_TABLE, sentimentId),
        {
          id: sentimentId,
          beingId,
          subjectId,
          subjectTable,
          tagId,
          weight,
        },
      );
      const stored = unwrapSingle(record);
      if (!stored) {
        sentimentLogger.warn("Upsert returned empty record", {
          beingId,
          subjectId,
          subjectTable,
          tagId,
          tags: ["mutation", "upsert"],
        });
        return null;
      }

      const ratio = newTotalWeight === 0 ? 0 : weight / newTotalWeight;

      const allocations = await hydrateSentiments(ctx, [toSentimentRecord(stored)]);
      const allocation = allocations[0];
      if (!allocation) {
        return null;
      }
      allocation.totalWeightForTag = newTotalWeight;
      allocation.ratio = ratio;
      allocation.maxWeight = maxWeight;

      sentimentLogger.info("Sentiment upserted", {
        beingId,
        subjectId,
        subjectTable,
        tagId,
        weight,
        totalWeightForTag: newTotalWeight,
        tags: ["mutation", "upsert"],
      });
      return allocation;
    },
    async listForBeing(
      beingId: string,
      options?: { tagId?: string; subjectTable?: string },
    ) {
      const subjectTable = options?.subjectTable ?? "missive";
      sentimentLogger.debug("Listing sentiments for being", {
        beingId,
        tagId: options?.tagId,
        subjectTable,
        tags: ["query"],
      });

      const sentiments = await selectSentiments(ctx, {
        beingId,
        tagId: options?.tagId,
        subjectTable,
      });

      if (sentiments.length === 0) {
        sentimentLogger.debug("No sentiments found", {
          beingId,
          tagId: options?.tagId,
          subjectTable,
          tags: ["query"],
        });
        return [] as SentimentAllocation[];
      }

      const hydrated = await hydrateSentiments(ctx, sentiments);

      const totals = hydrated.reduce((acc, sentiment) => {
        const key = `${sentiment.tagId}:${sentiment.subjectTable}`;
        acc.set(key, (acc.get(key) ?? 0) + sentiment.weight);
        return acc;
      }, new Map<string, number>());

      const allocations = hydrated.map((sentiment) => {
        const key = `${sentiment.tagId}:${sentiment.subjectTable}`;
        const totalWeightForTag = totals.get(key) ?? 0;
        const ratio =
          totalWeightForTag === 0 ? 0 : sentiment.weight / totalWeightForTag;
        return {
          ...sentiment,
          totalWeightForTag,
          ratio,
        } satisfies SentimentAllocation;
      });

      sentimentLogger.debug("Sentiments listed", {
        beingId,
        count: allocations.length,
        tagId: options?.tagId,
        subjectTable,
        tags: ["query"],
      });
      return allocations;
    },
    async remove({
      beingId,
      subjectId,
      subjectTable = "missive",
      tagId,
    }: {
      beingId: string;
      subjectId: string;
      subjectTable?: string;
      tagId: string;
    }) {
      sentimentLogger.debug("Removing sentiment", {
        beingId,
        subjectId,
        subjectTable,
        tagId,
        tags: ["mutation", "remove"],
      });
      await ctx.db.delete(
        new RecordId(
          SENTIMENT_TABLE,
          `${beingId}:${tagId}:${subjectTable}:${subjectId}`,
        ),
      );
      sentimentLogger.info("Sentiment removed", {
        beingId,
        subjectId,
        subjectTable,
        tagId,
        tags: ["mutation", "remove"],
      });
    },
  } satisfies {
    upsert: (input: {
      beingId: string;
      subjectId: string;
      subjectTable?: string;
      tagId: string;
      weight: number;
      maxWeight?: number;
    }) => Promise<SentimentAllocation | null>;
    listForBeing: (
      beingId: string,
      options?: { tagId?: string; subjectTable?: string },
    ) => Promise<SentimentAllocation[]>;
    remove: (input: {
      beingId: string;
      subjectId: string;
      subjectTable?: string;
      tagId: string;
    }) => Promise<void>;
  };
};
