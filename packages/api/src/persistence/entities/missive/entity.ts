import { nanoid } from "nanoid";
import { RecordId, StringRecordId } from "surrealdb";

import { labelFromSlug, normalizeOptionalSlug } from "@root-solar/globalization";
import { createAppLogger } from "@root-solar/observability";
import type { Context } from "../../../context.ts";
import type { TagRecord } from "../index.ts";

const missiveLogger = createAppLogger("persistence:missive", {
  tags: ["persistence", "missive"],
});

export type MissiveRecord = {
  id: string;
  title: string;
  details?: string;
  tags: TagRecord[];
};

type StoredMissiveRecord = {
  id: string | RecordId;
  title: string;
  details?: string;
  tags?: (string | RecordId)[];
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

const toMissiveRecordId = (value: string) =>
  value.includes(":") ? new StringRecordId(value) : new RecordId(TABLE, value);

const isDuplicateRecordError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }
  return /already exists/i.test(error.message);
};

const MAX_CREATE_ATTEMPTS = 5;

const normaliseRecord = (record: StoredMissiveRecord): StoredMissiveRecord => ({
  ...record,
  id: typeof record.id === "string" ? record.id : record.id.toString(),
  tags: record.tags?.map((tag) => (typeof tag === "string" ? tag : tag.toString())),
});

const collectTagIds = (records: StoredMissiveRecord[]) => {
  const ids = new Set<string>();
  for (const record of records) {
    for (const tagId of record.tags ?? []) {
      if (typeof tagId === "string" && tagId.length > 0) {
        ids.add(tagId);
        continue;
      }
      if (tagId instanceof RecordId) {
        ids.add(tagId.toString());
      }
    }
  }
  return Array.from(ids);
};

const toMissiveRecord = (
  record: StoredMissiveRecord,
  tagLookup: Map<string, TagRecord>,
): MissiveRecord => {
  const tagIds = record.tags ?? [];
  const tags = tagIds
    .map((tagId) => tagLookup.get(typeof tagId === "string" ? tagId : tagId.toString()))
    .filter((tag): tag is TagRecord => Boolean(tag));
  return {
    id: typeof record.id === "string" ? record.id : record.id.toString(),
    title: record.title,
    details: record.details,
    tags,
  } satisfies MissiveRecord;
};

const KNOWN_TAG_DEFINITIONS = new Map(
  [
    {
      slug: "sentimental",
      label: "Sentimental",
      tags: ["tag:sentimental"],
    },
    {
      slug: "priority",
      label: "Priority",
      tags: ["tag:sentimental"],
    },
    {
      slug: "axiomatic",
      label: "Axiomatic",
      tags: ["tag:sentimental"],
    },
    {
      slug: "axiom",
      label: "Axiom",
      tags: ["tag:sentimental"],
    },
  ].map((definition) => [definition.slug, definition] as const),
);

const stripTagPrefix = (value: string) =>
  value.length >= 4 && value.slice(0, 4).toLowerCase() === "tag:"
    ? value.slice(4)
    : value;

const stripTagDecorators = (value: string) => {
  const withoutHash = value.startsWith("#") ? value.slice(1) : value;
  return stripTagPrefix(withoutHash);
};

const resolveTagSlug = (input: string | null | undefined): string | null => {
  if (!input) {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  return normalizeOptionalSlug(stripTagDecorators(trimmed));
};

const ensureTagsExist = async (ctx: Context, tagInputs?: string[]) => {
  if (!tagInputs || tagInputs.length === 0) {
    return [] as string[];
  }

  const resolvedSlugs = tagInputs
    .map((input) => resolveTagSlug(input))
    .filter((slug): slug is string => Boolean(slug));

  if (resolvedSlugs.length === 0) {
    missiveLogger.debug("No valid tag slugs provided", {
      provided: tagInputs,
      tags: ["mutation", "tag"],
    });
    return [] as string[];
  }

  const uniqueDefinitions = new Map<string, { slug: string; label: string; tags: string[] }>();
  for (const slug of resolvedSlugs) {
    if (uniqueDefinitions.has(slug)) {
      continue;
    }
    const known = KNOWN_TAG_DEFINITIONS.get(slug);
    uniqueDefinitions.set(
      slug,
      known ?? {
        slug,
        label: labelFromSlug(slug),
        tags: ["tag:sentimental"],
      },
    );
  }

  const ensured = await ctx.tags.ensureMany(Array.from(uniqueDefinitions.values()));
  const idBySlug = new Map(ensured.map((tag) => [tag.slug, tag.id] as const));

  return resolvedSlugs
    .map((slug) => {
      const tagId = idBySlug.get(slug);
      if (!tagId) {
        missiveLogger.warn("Unable to resolve ensured tag id", {
          slug,
          tags: ["mutation", "tag"],
        });
      }
      return tagId;
    })
    .filter((tagId): tagId is string => Boolean(tagId));
};

export type MissiveModel = ReturnType<typeof createMissiveModel>;

export const createMissiveModel = (ctx: Context) => {
  const hydrateRecords = async (
    records: StoredMissiveRecord[],
  ): Promise<MissiveRecord[]> => {
    if (records.length === 0) {
      return [];
    }
    const tagIds = collectTagIds(records);
    const tags = tagIds.length > 0 ? await ctx.tags.getMany(tagIds) : [];
    const tagLookup = new Map(tags.map((tag) => [tag.id, tag]));
    return records.map((record) => toMissiveRecord(normaliseRecord(record), tagLookup));
  };

  return {
    async list(options?: { sentimentSlug?: string }) {
      missiveLogger.debug("Listing missives", {
        tags: ["query"],
      });
      const records = await ctx.db.select<StoredMissiveRecord>(TABLE);
      const normalized = (records ?? []).map(normaliseRecord);
      const hydrated = await hydrateRecords(normalized);
      const filtered = (() => {
        if (!options?.sentimentSlug) {
          return hydrated;
        }
        const slug = options.sentimentSlug.startsWith("tag:")
          ? options.sentimentSlug.slice(4)
          : options.sentimentSlug;
        const legacyAliases = slug === "axiomatic" ? new Set(["axiomatic", "axiom"]) : new Set([slug]);
        return hydrated.filter((record) =>
          record.tags.some((tag) => legacyAliases.has(tag.slug)),
        );
      })();
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      missiveLogger.debug("Missives listed", {
        count: filtered.length,
        tags: ["query"],
      });
      return filtered;
    },
    async get(id: string) {
      missiveLogger.debug("Fetching missive", {
        id,
        tags: ["query"],
      });
      const recordId = toMissiveRecordId(id);
      const record = await ctx.db.select<StoredMissiveRecord>(recordId);
      const stored = unwrapSingle(record);
      if (!stored) {
        missiveLogger.debug("Missive not found", {
          id,
          tags: ["query"],
        });
        return null;
      }
      const hydrated = await hydrateRecords([stored]);
      const result = hydrated[0] ?? null;
      if (result) {
        missiveLogger.debug("Missive fetched", {
          id: result.id,
          tags: ["query"],
        });
      }
      return result;
    },
    async create(input: {
      title: string;
      details?: string;
      tagSlugs?: string[];
    }) {
      const tagIds = await ensureTagsExist(ctx, input.tagSlugs);

      for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
        const id = nanoid();

        try {
          missiveLogger.debug("Creating missive", {
            attempt,
            title: input.title,
            tags: ["mutation", "create"],
          });
          const recordId = new RecordId(TABLE, id);
          const record = await ctx.db.create<StoredMissiveRecord>(
            recordId,
            {
              id: recordId,
              title: input.title,
              details: input.details,
              tags: tagIds,
            },
          );
          const stored = unwrapSingle(record);
          if (!stored) {
            throw new Error("Missive creation returned empty record");
          }
          const hydrated = await hydrateRecords([stored]);
          const created = hydrated[0];
          missiveLogger.info("Missive created", {
            id,
            title: input.title,
            tags: ["mutation", "create"],
          });
          return created;
        } catch (error) {
          if (isDuplicateRecordError(error)) {
            missiveLogger.warn("Duplicate missive id detected; retrying", {
              attempt,
              tags: ["mutation", "create"],
            });
            continue;
          }
          missiveLogger.error("Failed to create missive", error, {
            title: input.title,
            tags: ["mutation", "create"],
          });
          throw error;
        }
      }

      missiveLogger.error("Exhausted attempts to create missive", {
        title: input.title,
        tags: ["mutation", "create"],
      });
      throw new Error("Unable to allocate unique id for new missive");
    },
    async addTag({ missiveId, tagSlug }: { missiveId: string; tagSlug: string }) {
      const resolvedSlug = resolveTagSlug(tagSlug);
      if (!resolvedSlug) {
        missiveLogger.debug("Skipped adding invalid tag slug", {
          missiveId,
          providedSlug: tagSlug,
          tags: ["mutation", "tag"],
        });
        return null;
      }

      const recordId = toMissiveRecordId(missiveId);

      const existingRecord = await ctx.db.select<StoredMissiveRecord>(recordId);
      const stored = unwrapSingle(existingRecord);
      if (!stored) {
        missiveLogger.debug("Missive not found when adding tag", {
          missiveId,
          tags: ["mutation", "tag"],
        });
        return null;
      }

      const normalizedRecord = normaliseRecord(stored);
      const [ensuredTagId] = await ensureTagsExist(ctx, [resolvedSlug]);
      if (!ensuredTagId) {
        missiveLogger.warn("Failed to ensure tag for missive", {
          missiveId,
          slug: resolvedSlug,
          tags: ["mutation", "tag"],
        });
        const hydrated = await hydrateRecords([normalizedRecord]);
        return hydrated[0] ?? null;
      }

      const existingTagIds = new Set(normalizedRecord.tags ?? []);
      if (existingTagIds.has(ensuredTagId)) {
        missiveLogger.debug("Tag already present on missive", {
          missiveId,
          tagId: ensuredTagId,
          slug: resolvedSlug,
          tags: ["mutation", "tag"],
        });
        const hydrated = await hydrateRecords([normalizedRecord]);
        return hydrated[0] ?? null;
      }

      existingTagIds.add(ensuredTagId);
      const nextTagIds = Array.from(existingTagIds);

      missiveLogger.debug("Appending tag to missive", {
        missiveId,
        tagId: ensuredTagId,
        slug: resolvedSlug,
        tags: ["mutation", "tag"],
      });

      await ctx.db.merge(recordId, {
        tags: nextTagIds,
      });

      const refreshedRecord = await ctx.db.select<StoredMissiveRecord>(recordId);
      const reloaded = unwrapSingle(refreshedRecord);
      if (!reloaded) {
        missiveLogger.warn("Reload after tag append returned empty record", {
          missiveId,
          tagId: ensuredTagId,
          tags: ["mutation", "tag"],
        });
      }
      const storedUpdated =
        reloaded ?? ({
          ...normalizedRecord,
          id: typeof normalizedRecord.id === "string"
            ? normalizedRecord.id
            : normalizedRecord.id.toString(),
          tags: nextTagIds,
        } satisfies StoredMissiveRecord);

      const hydrated = await hydrateRecords([normaliseRecord(storedUpdated)]);
      const result = hydrated[0] ?? null;
      if (result) {
        missiveLogger.info("Tag appended to missive", {
          missiveId: result.id,
          tagId: ensuredTagId,
          slug: resolvedSlug,
          tags: ["mutation", "tag"],
        });
      }
      return result;
    },
    async removeTag({ missiveId, tagSlug }: { missiveId: string; tagSlug: string }) {
      const resolvedSlug = resolveTagSlug(tagSlug);
      if (!resolvedSlug) {
        missiveLogger.debug("Skipped removing invalid tag slug", {
          missiveId,
          providedSlug: tagSlug,
          tags: ["mutation", "tag"],
        });
        return null;
      }

      const recordId = toMissiveRecordId(missiveId);
      const existingRecord = await ctx.db.select<StoredMissiveRecord>(recordId);
      const stored = unwrapSingle(existingRecord);
      if (!stored) {
        missiveLogger.debug("Missive not found when removing tag", {
          missiveId,
          tags: ["mutation", "tag"],
        });
        return null;
      }

      const normalizedRecord = normaliseRecord(stored);
      const normalizedTagId = `tag:${resolvedSlug}`;
      const existingTagIds = new Set(normalizedRecord.tags ?? []);

      if (!existingTagIds.has(normalizedTagId)) {
        missiveLogger.debug("Tag not present on missive", {
          missiveId,
          slug: resolvedSlug,
          tags: ["mutation", "tag"],
        });
        const hydrated = await hydrateRecords([normalizedRecord]);
        return hydrated[0] ?? null;
      }

      existingTagIds.delete(normalizedTagId);
      const nextTagIds = Array.from(existingTagIds);

      missiveLogger.debug("Removing tag from missive", {
        missiveId,
        slug: resolvedSlug,
        tags: ["mutation", "tag"],
      });

      await ctx.db.merge(recordId, {
        tags: nextTagIds,
      });

      const refreshedRecord = await ctx.db.select<StoredMissiveRecord>(recordId);
      const reloaded = unwrapSingle(refreshedRecord);
      const storedUpdated =
        reloaded ?? ({
          ...normalizedRecord,
          tags: nextTagIds,
        } satisfies StoredMissiveRecord);

      const hydrated = await hydrateRecords([normaliseRecord(storedUpdated)]);
      const result = hydrated[0] ?? null;
      if (result) {
        missiveLogger.info("Tag removed from missive", {
          missiveId: result.id,
          slug: resolvedSlug,
          tags: ["mutation", "tag"],
        });
      }
      return result;
    },
  } satisfies {
    list: (options?: { sentimentSlug?: string }) => Promise<MissiveRecord[]>;
    get: (id: string) => Promise<MissiveRecord | null>;
    create: (input: {
      title: string;
      details?: string;
      tagSlugs?: string[];
    }) => Promise<MissiveRecord>;
    addTag: (input: { missiveId: string; tagSlug: string }) => Promise<MissiveRecord | null>;
    removeTag: (input: { missiveId: string; tagSlug: string }) => Promise<MissiveRecord | null>;
  };
};

export type AxiomRecord = MissiveRecord;
export type AxiomModel = MissiveModel;
export const createAxiomModel = createMissiveModel;
