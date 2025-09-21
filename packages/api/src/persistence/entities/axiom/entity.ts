import { nanoid } from "nanoid";
import { RecordId, StringRecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import type { Context } from "../../../context.ts";

const axiomLogger = createAppLogger("persistence:axiom", {
  tags: ["persistence", "axiom"],
});

export type AxiomRecord = {
  id: string;
  title: string;
  details?: string;
  kind?: string;
};

const TABLE = "missive" as const;

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
    async get(id: string) {
      axiomLogger.debug("Fetching axiom", {
        id,
        tags: ["query"],
      });
      const recordId = id.includes(":")
        ? new StringRecordId(id)
        : new RecordId(TABLE, id);
      const record = await ctx.db.select<AxiomRecord | null>(recordId);
      const stored = unwrapSingle(record);
      if (!stored) {
        axiomLogger.debug("Axiom not found", {
          id,
          tags: ["query"],
        });
        return null;
      }
      const normalized: AxiomRecord = {
        ...stored,
        id: typeof stored.id === "string" ? stored.id : stored.id.toString(),
      };
      axiomLogger.debug("Axiom fetched", {
        id: normalized.id,
        tags: ["query"],
      });
      return normalized;
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
            {
              ...input,
              kind: input.kind ?? "axiom",
            },
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
    get: (id: string) => Promise<AxiomRecord | null>;
    create: (input: Omit<AxiomRecord, "id">) => Promise<AxiomRecord>;
  };
};
