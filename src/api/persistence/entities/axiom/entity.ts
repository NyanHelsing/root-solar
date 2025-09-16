import { RecordId } from "surrealdb";

import type { Context } from "../../../context.ts";

export type AxiomRecord = {
  id: number;
  title: string;
  details?: string;
};

const TABLE = "axiom" as const;

export type AxiomModel = ReturnType<typeof createAxiomModel>;

export const createAxiomModel = (ctx: Context) => {
  return {
    async list() {
      const records = await ctx.db.select<AxiomRecord>(TABLE);
      return (records ?? []).sort((a, b) => a.id - b.id);
    },
    async create(input: AxiomRecord) {
      const record = await ctx.db.upsert<AxiomRecord>(
        new RecordId(TABLE, input.id),
        input,
      );
      return record;
    },
  } satisfies {
    list: () => Promise<AxiomRecord[]>;
    create: (input: AxiomRecord) => Promise<AxiomRecord>;
  };
};
