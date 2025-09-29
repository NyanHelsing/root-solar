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

type StoredBeingRecord = Omit<BeingRecord, "id"> & {
  id: string | RecordId;
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
  const normalise = ({ id, ...rest }: StoredBeingRecord): BeingRecord => ({
    id: typeof id === "string" ? id : id.toString(),
    ...rest,
  });

  return {
    async list() {
      beingLogger.debug("Listing beings", {
        tags: ["query"],
      });
      const records = await ctx.db.select<StoredBeingRecord>(TABLE);
      const sorted = (records ?? [])
        .map(normalise)
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
      const record = await ctx.db.select<StoredBeingRecord>(
        new StringRecordId(`${TABLE}:${id}`),
      );
      const stored = unwrapSingle(record);
      if (!stored) {
        beingLogger.debug("Being not found", {
          id,
          tags: ["query"],
        });
        return null;
      }
      return normalise(stored);
    },
    async create(input: Omit<BeingRecord, "id">) {
      const id = nanoid();
      beingLogger.debug("Creating being", {
        id,
        name: input.name,
        tags: ["mutation", "create"],
      });
      const being = await ctx.db.upsert<StoredBeingRecord>(
        new RecordId(TABLE, id),
        {
          ...input,
          id,
        } satisfies StoredBeingRecord,
      );
      beingLogger.info("Being created", {
        id,
        name: being.name,
        tags: ["mutation", "create"],
      });
      return normalise(being);
    },
    async upsert(input: BeingRecord) {
      beingLogger.debug("Upserting being", {
        id: input.id,
        name: input.name,
        tags: ["mutation", "upsert"],
      });
      const record = await ctx.db.upsert<StoredBeingRecord>(
        new RecordId(TABLE, input.id),
        {
          ...input,
          id: input.id,
        } satisfies StoredBeingRecord,
      );
      const stored = unwrapSingle(record);
      if (!stored) {
        beingLogger.warn("Being upsert returned empty", {
          id: input.id,
          tags: ["mutation", "upsert"],
        });
        return null;
      }
      return normalise(stored);
    },
  } satisfies {
    list: () => Promise<BeingRecord[]>;
    get: (id: string) => Promise<BeingRecord | null>;
    create: (input: Omit<BeingRecord, "id">) => Promise<BeingRecord>;
    upsert: (input: BeingRecord) => Promise<BeingRecord | null>;
  };
};
