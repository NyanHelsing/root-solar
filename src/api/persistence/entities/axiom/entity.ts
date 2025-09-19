import { nanoid } from "nanoid";
import { RecordId } from "surrealdb";

import { createAppLogger } from "../../../../logging/index.ts";
import type { Context } from "../../../context.ts";

const axiomLogger = createAppLogger("persistence:axiom", {
  tags: ["persistence", "axiom"],
});

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
      axiomLogger.debug("Listing axioms", {
        tags: ["query"],
      });
      const records = await ctx.db.select<AxiomRecord>(TABLE);
      const sorted = (records ?? []).sort((a, b) => a.title.localeCompare(b.title));
      axiomLogger.debug("Axioms listed", {
        count: sorted.length,
        tags: ["query"],
      });
      return sorted;
    },
    async create(input: Omit<AxiomRecord, "id">) {
      for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
        const id = nanoid();

        try {
          axiomLogger.debug("Creating axiom", {
            attempt,
            title: input.title,
            tags: ["mutation", "create"],
          });
          const record = await ctx.db.create<AxiomRecord>(
            new RecordId(TABLE, id),
            input,
          );
          axiomLogger.info("Axiom created", {
            id,
            title: input.title,
            tags: ["mutation", "create"],
          });
          return record;
        } catch (error) {
          if (isDuplicateRecordError(error)) {
            axiomLogger.warn("Duplicate axiom id detected; retrying", {
              attempt,
              tags: ["mutation", "create"],
            });
            continue;
          }
          axiomLogger.error("Failed to create axiom", error, {
            title: input.title,
            tags: ["mutation", "create"],
          });
          throw error;
        }
      }

      axiomLogger.error("Exhausted attempts to create axiom", {
        title: input.title,
        tags: ["mutation", "create"],
      });
      throw new Error("Unable to allocate unique id for new axiom");
    },
  } satisfies {
    list: () => Promise<AxiomRecord[]>;
    create: (input: Omit<AxiomRecord, "id">) => Promise<AxiomRecord>;
  };
};
