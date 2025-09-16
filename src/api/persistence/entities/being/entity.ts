import { RecordId } from "surrealdb";

import type { Context } from "../../../context.ts";

export type BeingRecord = {
  id: number;
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
      return (records ?? []).sort((a, b) => a.id - b.id);
    },
    async get(id: number) {
      const record = await ctx.db.select<BeingRecord>(
        new RecordId(TABLE, id),
      );
      return unwrapSingle(record);
    },
    async upsert(input: BeingRecord) {
      const record = await ctx.db.upsert<BeingRecord>(
        new RecordId(TABLE, input.id),
        input,
      );
      return unwrapSingle(record);
    },
  } satisfies {
    list: () => Promise<BeingRecord[]>;
    get: (id: number) => Promise<BeingRecord | null>;
    upsert: (input: BeingRecord) => Promise<BeingRecord | null>;
  };
};
