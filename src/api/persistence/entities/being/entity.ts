import { RecordId, StringRecordId } from "surrealdb";

import type { Context } from "../../../context.ts";
import { nanoid } from "nanoid";

export type BeingRecord = {
  id: string;
  name: string;
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
      const records = await ctx.db.select<BeingRecord>(TABLE);
      return (records ?? [])
        .map((record) => ({
          ...record,
          id: typeof record.id === "string" ? record.id : record.id.toString(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    async get(id: string) {
      const record = await ctx.db.select<BeingRecord>(
        new StringRecordId(TABLE, id),
      );
      const stored = unwrapSingle(record);
      if (!stored) {
        return null;
      }
      return {
        ...stored,
        id: typeof stored.id === "string" ? stored.id : stored.id.toString(),
      } satisfies BeingRecord;
    },
    async create(input: BeingRecord) {
      const id = nanoid();
      const being = await ctx.db.upsert<BeingRecord>(new RecordId(TABLE, id), {
        ...input,
        id,
      });
      return {
        ...being,
      } satisfies BeingRecord;
    },
    async upsert(input: BeingRecord) {
      const record = await ctx.db.upsert<BeingRecord>(
        new RecordId(TABLE, input.id),
        input,
      );
      const stored = unwrapSingle(record);
      if (!stored) {
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
