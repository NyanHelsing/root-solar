import { RecordId, StringRecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import type { Context } from "../../../context.ts";
import { nanoid } from "nanoid";

const beingLogger = createAppLogger("persistence:being", {
  tags: ["persistence", "being"],
});

export type BeingRecord = {
  id: string;
  name: string;
  signingPublicKey?: string;
  encryptionPublicKey?: string;
  intentBase64?: string;
  messageBase64?: string;
};

const TABLE = "being" as const;

const unwrapSingle = <T>(value: T | T[] | null): T | null => {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
};

export type BeingModel = ReturnType<typeof createBeingModel>;

export const createBeingModel = (ctx: Context) => {
  return {
    async list() {
      beingLogger.debug("Listing beings", {
        tags: ["query"],
      });
      const records = await ctx.db.select<BeingRecord>(TABLE);
      const sorted = (records ?? [])
        .map((record) => ({
          ...record,
          id: typeof record.id === "string" ? record.id : record.id.toString(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      beingLogger.debug("Beings listed", {
        count: sorted.length,
        tags: ["query"],
      });
      return sorted;
    },
    async get(id: string) {
      beingLogger.debug("Fetching being", {
        id,
        tags: ["query"],
      });
      const record = await ctx.db.select<BeingRecord>(
        new StringRecordId(TABLE, id),
      );
      const stored = unwrapSingle(record);
      if (!stored) {
        beingLogger.debug("Being not found", {
          id,
          tags: ["query"],
        });
        return null;
      }
      return {
        ...stored,
        id: typeof stored.id === "string" ? stored.id : stored.id.toString(),
      } satisfies BeingRecord;
    },
    async create(input: Omit<BeingRecord, "id">) {
      const id = nanoid();
      beingLogger.debug("Creating being", {
        id,
        name: input.name,
        tags: ["mutation", "create"],
      });
      const being = await ctx.db.upsert<BeingRecord>(new RecordId(TABLE, id), {
        ...input,
        id,
      });
      beingLogger.info("Being created", {
        id,
        name: being.name,
        tags: ["mutation", "create"],
      });
      return {
        ...being,
      } satisfies BeingRecord;
    },
    async upsert(input: BeingRecord) {
      beingLogger.debug("Upserting being", {
        id: input.id,
        name: input.name,
        tags: ["mutation", "upsert"],
      });
      const record = await ctx.db.upsert<BeingRecord>(
        new RecordId(TABLE, input.id),
        input,
      );
      const stored = unwrapSingle(record);
      if (!stored) {
        beingLogger.warn("Being upsert returned empty", {
          id: input.id,
          tags: ["mutation", "upsert"],
        });
        return null;
      }
      return {
        ...stored,
        id: typeof stored.id === "string" ? stored.id : stored.id.toString(),
      } satisfies BeingRecord;
    },
  } satisfies {
    list: () => Promise<BeingRecord[]>;
    get: (id: string) => Promise<BeingRecord | null>;
    upsert: (input: BeingRecord) => Promise<BeingRecord | null>;
  };
};
