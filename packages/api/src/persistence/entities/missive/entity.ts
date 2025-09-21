import { nanoid } from "nanoid";
import { RecordId, StringRecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import type {
  MissiveKind,
  MissiveRecord,
} from "@root-solar/planning";

import type { Context } from "../../../context.ts";

const missiveLogger = createAppLogger("persistence:missive", {
  tags: ["persistence", "missive"],
});

const MISSIVE_TABLE = "missive" as const;
const MAX_CREATE_ATTEMPTS = 5;

const isDuplicateRecordError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }
  return /already exists/i.test(error.message);
};

type RawMissiveRecord = Omit<MissiveRecord, "id"> & {
  id: string | RecordId;
};

const normalizeMissiveRecord = (record: RawMissiveRecord): MissiveRecord => ({
  ...record,
  id: typeof record.id === "string" ? record.id : record.id.toString(),
  metadata: record.metadata ?? {},
});

const generateSlug = (title: string) => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
  if (base.length > 0) {
    return base;
  }
  return nanoid(8).toLowerCase();
};

const parseMissiveId = (id: string): { kind?: MissiveKind; slug?: string } => {
  const parts = id.split(":");
  if (parts.length < 3) {
    return {};
  }
  const [, kind, ...slugParts] = parts;
  const slug = slugParts.join(":");
  return {
    kind: kind as MissiveKind,
    slug,
  };
};

const sanitizeSlug = (slug: string) =>
  slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const createRecordPayload = (
  input: Omit<MissiveRecord, "id"> & { updatedAt?: string },
) => ({
  ...input,
  metadata: input.metadata ?? {},
  updatedAt: input.updatedAt ?? new Date().toISOString(),
});

export type MissiveModel = ReturnType<typeof createMissiveModel>;

export type MissiveCreateInput = {
  kind: MissiveKind;
  title: string;
  slug?: string;
  summary?: string;
  body?: string;
  docPath?: string;
  metadata?: Record<string, unknown>;
};

export type MissiveUpsertInput = MissiveRecord;

export const createMissiveModel = (ctx: Context) => {
  return {
    async list(options?: { kind?: MissiveKind }) {
      missiveLogger.debug("Listing missives", {
        kind: options?.kind,
        tags: ["query"],
      });
      const records = await ctx.db.select<RawMissiveRecord[]>(MISSIVE_TABLE);
      const normalized = (records ?? []).map(normalizeMissiveRecord);
      const filtered = options?.kind
        ? normalized.filter((record) => record.kind === options.kind)
        : normalized;
      const sorted = filtered.sort((a, b) => a.title.localeCompare(b.title));
      missiveLogger.debug("Missives listed", {
        count: sorted.length,
        kind: options?.kind,
        tags: ["query"],
      });
      return sorted;
    },
    async get(id: string) {
      missiveLogger.debug("Fetching missive", {
        id,
        tags: ["query"],
      });
      const recordId = id.includes(":")
        ? new StringRecordId(id)
        : new RecordId(MISSIVE_TABLE, id);
      const record = await ctx.db.select<RawMissiveRecord | RawMissiveRecord[] | null>(recordId);
      if (!record) {
        missiveLogger.debug("Missive not found", {
          id,
          tags: ["query"],
        });
        return null;
      }
      const stored = Array.isArray(record) ? record[0] : record;
      if (!stored) {
        missiveLogger.debug("Missive not found after unwrap", {
          id,
          tags: ["query"],
        });
        return null;
      }
      const normalized = normalizeMissiveRecord(stored);
      missiveLogger.debug("Missive fetched", {
        id: normalized.id,
        tags: ["query"],
      });
      return normalized;
    },
    async create(input: MissiveCreateInput) {
      const baseSlug = sanitizeSlug(input.slug ?? generateSlug(input.title));
      const slug = baseSlug.length > 0 ? baseSlug : generateSlug(input.title);

      for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
        const slugCandidate =
          attempt === 0 ? slug : `${slug}-${nanoid(5).toLowerCase()}`;
        const recordId = new RecordId(MISSIVE_TABLE, `${input.kind}:${slugCandidate}`);
        try {
          missiveLogger.debug("Creating missive", {
            kind: input.kind,
            slug: slugCandidate,
            attempt,
            tags: ["mutation", "create"],
          });
          const record = await ctx.db.create<RawMissiveRecord>(recordId, {
            slug: slugCandidate,
            kind: input.kind,
            title: input.title,
            summary: input.summary,
            body: input.body,
            docPath: input.docPath,
            metadata: input.metadata ?? {},
            updatedAt: new Date().toISOString(),
          });
          const stored = Array.isArray(record) ? record[0] : record;
          if (!stored) {
            throw new Error("Create missive returned empty record");
          }
          const normalized = normalizeMissiveRecord(stored);
          missiveLogger.info("Missive created", {
            id: normalized.id,
            kind: normalized.kind,
            slug: normalized.slug,
            tags: ["mutation", "create"],
          });
          return normalized;
        } catch (error) {
          if (isDuplicateRecordError(error)) {
            missiveLogger.warn("Duplicate missive candidate detected; retrying", {
              attempt,
              slug: slugCandidate,
              tags: ["mutation", "create"],
            });
            continue;
          }
          missiveLogger.error("Failed to create missive", error, {
            kind: input.kind,
            slug: slugCandidate,
            tags: ["mutation", "create"],
          });
          throw error;
        }
      }

      missiveLogger.error("Exhausted attempts to create missive", {
        kind: input.kind,
        title: input.title,
        tags: ["mutation", "create"],
      });
      throw new Error("Unable to allocate unique id for new missive");
    },
    async upsert(input: MissiveUpsertInput) {
      const inferred = parseMissiveId(input.id);
      const kind = input.kind ?? inferred.kind;
      if (!kind) {
        throw new Error("Missive kind is required for upsert");
      }
      const slug = sanitizeSlug(
        input.slug ?? inferred.slug ?? generateSlug(input.title),
      );
      const recordId = input.id.includes(":")
        ? new StringRecordId(input.id)
        : new RecordId(MISSIVE_TABLE, `${kind}:${slug}`);
      missiveLogger.debug("Upserting missive", {
        id: input.id,
        kind,
        slug,
        tags: ["mutation", "upsert"],
      });
      const record = await ctx.db.upsert<RawMissiveRecord>(
        recordId,
        createRecordPayload({
          kind,
          slug,
          title: input.title,
          summary: input.summary,
          body: input.body,
          docPath: input.docPath,
          metadata: input.metadata,
          updatedAt: input.updatedAt,
        }),
      );
      const stored = Array.isArray(record) ? record[0] : record;
      if (!stored) {
        missiveLogger.warn("Upsert returned empty missive", {
          id: input.id,
          tags: ["mutation", "upsert"],
        });
        return null;
      }
      const normalized = normalizeMissiveRecord(stored);
      missiveLogger.info("Missive upserted", {
        id: normalized.id,
        kind: normalized.kind,
        slug: normalized.slug,
        tags: ["mutation", "upsert"],
      });
      return normalized;
    },
  } satisfies {
    list: (options?: { kind?: MissiveKind }) => Promise<MissiveRecord[]>;
    get: (id: string) => Promise<MissiveRecord | null>;
    create: (input: MissiveCreateInput) => Promise<MissiveRecord>;
    upsert: (input: MissiveUpsertInput) => Promise<MissiveRecord | null>;
  };
};
