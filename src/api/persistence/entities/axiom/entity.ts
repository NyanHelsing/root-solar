import { nanoid } from "nanoid";
import { RecordId } from "surrealdb";

import type { Context } from "../../../context.ts";

export type AxiomRecord = {
  id: string;
  title: string;
  details?: string;
};

const TABLE = "axiom" as const;

const unwrapSingle = <T>(value: T | T[] | null): T | null => {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
};

const isDuplicateRecordError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }
  return /already exists/i.test(error.message);
};

const MAX_CREATE_ATTEMPTS = 5;

export type AxiomModel = ReturnType<typeof createAxiomModel>;

export const createAxiomModel = (ctx: Context) => {
  return {
    async list() {
      const records = await ctx.db.select<AxiomRecord>(TABLE);
      return (records ?? []).sort((a, b) => a.title.localeCompare(b.title));
    },
    async create(input: Omit<AxiomRecord, "id">) {
      for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
        const id = nanoid();

        try {
          return await ctx.db.create<AxiomRecord>(
            new RecordId(TABLE, id),
            input,
          );
        } catch (error) {
          if (isDuplicateRecordError(error)) {
            continue;
          }
          throw error;
        }
      }

      throw new Error("Unable to allocate unique id for new axiom");
    },
  } satisfies {
    list: () => Promise<AxiomRecord[]>;
    create: (input: Omit<AxiomRecord, "id">) => Promise<AxiomRecord>;
  };
};
