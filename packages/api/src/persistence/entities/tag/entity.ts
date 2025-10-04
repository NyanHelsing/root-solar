import { RecordId, StringRecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import { labelFromSlug, normalizeOptionalSlug } from "@root-solar/globalization";

import type { Context } from "../../../context.ts";

const TAG_TABLE = "tag" as const;

const tagLogger = createAppLogger("persistence:tag", {
    tags: ["persistence", "tag"],
});

export type TagRecord = {
    id: string;
    slug: string;
    label: string;
    description?: string;
    tags?: string[];
};

type RawTagRecord = Omit<TagRecord, "id" | "tags"> & {
    id: string | RecordId;
    tags?: (string | RecordId)[];
};

const normaliseId = (slugOrId: string) =>
    slugOrId.includes(":") ? slugOrId : `${TAG_TABLE}:${slugOrId}`;

const toTagRecordId = (value: string) =>
    value.includes(":") ? new StringRecordId(normaliseId(value)) : new RecordId(TAG_TABLE, value);

const toTagRecord = (record: RawTagRecord): TagRecord => ({
    ...record,
    id: typeof record.id === "string" ? record.id : record.id.toString(),
    tags: record.tags?.map((tag) => (typeof tag === "string" ? tag : tag.toString())),
});

const unwrapSingle = <T>(value: T | T[] | null): T | null => {
    if (value === null) {
        return null;
    }
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value;
};

const selectMany = async (ctx: Context, ids: string[]) => {
    const unique = Array.from(new Set(ids.map(normaliseId)));
    if (unique.length === 0) {
        return [];
    }

    const selections = await Promise.all(
        unique.map(async (identifier) => {
            const record = await ctx.db.select<RawTagRecord>(new StringRecordId(identifier));
            const stored = unwrapSingle(record);
            return stored ? toTagRecord(stored) : null;
        }),
    );

    return selections.filter((value): value is TagRecord => Boolean(value));
};

const stripTagPrefix = (value: string) =>
    value.length >= 4 && value.slice(0, 4).toLowerCase() === "tag:" ? value.slice(4) : value;

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

export type TagModel = ReturnType<typeof createTagModel>;

export const createTagModel = (ctx: Context) => {
    return {
        async list() {
            tagLogger.debug("Listing tags", {
                tags: ["query"],
            });
            const records = await ctx.db.select<RawTagRecord>(TAG_TABLE);
            const mapped = (records ?? []).map(toTagRecord);
            mapped.sort((a, b) => a.label.localeCompare(b.label));
            tagLogger.debug("Tags listed", {
                count: mapped.length,
                tags: ["query"],
            });
            return mapped;
        },
        async get(slugOrId: string) {
            const id = normaliseId(slugOrId);
            tagLogger.debug("Fetching tag", {
                id,
                tags: ["query"],
            });
            const recordIdentifier = id.includes(":")
                ? new StringRecordId(id)
                : new RecordId(TAG_TABLE, slugOrId);
            const record = await ctx.db.select<RawTagRecord>(recordIdentifier);
            const stored = unwrapSingle(record);
            if (!stored) {
                tagLogger.debug("Tag not found", {
                    id,
                    tags: ["query"],
                });
                return null;
            }
            const mapped = toTagRecord(stored);
            tagLogger.debug("Tag fetched", {
                id: mapped.id,
                tags: ["query"],
            });
            return mapped;
        },
        async upsert({
            slug,
            label,
            description,
            tags,
        }: {
            slug: string;
            label: string;
            description?: string;
            tags?: string[];
        }) {
            const id = normaliseId(slug);
            tagLogger.debug("Upserting tag", {
                id,
                label,
                tags: ["mutation", "upsert"],
            });
            const recordId = new RecordId(TAG_TABLE, slug);
            const record = await ctx.db.upsert<RawTagRecord>(recordId, {
                id: recordId,
                slug,
                label,
                description,
                tags,
            });
            const stored = unwrapSingle(record);
            if (!stored) {
                tagLogger.warn("Tag upsert returned empty record", {
                    id,
                    tags: ["mutation", "upsert"],
                });
                return null;
            }
            const mapped = toTagRecord(stored);
            tagLogger.info("Tag upserted", {
                id: mapped.id,
                slug: mapped.slug,
                tags: ["mutation", "upsert"],
            });
            return mapped;
        },
        async ensureMany(
            definitions: Array<{
                slug: string;
                label: string;
                description?: string;
                tags?: string[];
            }>,
        ) {
            const results = await Promise.all(
                definitions.map(async (definition) => {
                    const current = await this.get(definition.slug);
                    if (current) {
                        const needsUpdate =
                            current.label !== definition.label ||
                            current.description !== definition.description ||
                            JSON.stringify(current.tags ?? []) !==
                                JSON.stringify(definition.tags ?? []);
                        if (!needsUpdate) {
                            tagLogger.debug("Ensured existing tag without changes", {
                                slug: definition.slug,
                                tags: ["mutation", "ensure"],
                            });
                            return current;
                        }
                        tagLogger.debug("Updating tag while ensuring definition", {
                            slug: definition.slug,
                            tags: ["mutation", "ensure"],
                        });
                    }
                    tagLogger.debug("Creating tag while ensuring definition", {
                        slug: definition.slug,
                        tags: ["mutation", "ensure"],
                    });
                    return await this.upsert(definition);
                }),
            );
            return results.filter((item): item is TagRecord => item !== null);
        },
        async getMany(ids: string[]) {
            return await selectMany(ctx, ids);
        },
        async addParent({
            tagId,
            parentTagSlug,
        }: {
            tagId: string;
            parentTagSlug: string;
        }) {
            const resolvedParentSlug = resolveTagSlug(parentTagSlug);
            if (!resolvedParentSlug) {
                tagLogger.debug("Skipped adding invalid parent tag slug", {
                    tagId,
                    providedSlug: parentTagSlug,
                    tags: ["mutation", "tag"],
                });
                return null;
            }

            const parentDefinitions = await this.ensureMany([
                {
                    slug: resolvedParentSlug,
                    label: labelFromSlug(resolvedParentSlug),
                    tags: ["tag:sentimental"],
                },
            ]);

            const parentTag = parentDefinitions[0];
            if (!parentTag) {
                tagLogger.warn("Unable to ensure parent tag", {
                    tagId,
                    slug: resolvedParentSlug,
                    tags: ["mutation", "tag"],
                });
                return null;
            }

            const recordIdentifier = toTagRecordId(tagId);
            const existingRecord = await ctx.db.select<RawTagRecord>(recordIdentifier);
            const stored = unwrapSingle(existingRecord);
            if (!stored) {
                tagLogger.debug("Tag not found when adding parent", {
                    tagId,
                    tags: ["mutation", "tag"],
                });
                return null;
            }

            const existingParentIds = new Set(
                (stored.tags ?? []).map((value) =>
                    typeof value === "string" ? value : value.toString(),
                ),
            );
            if (existingParentIds.has(parentTag.id)) {
                tagLogger.debug("Parent tag already linked", {
                    tagId,
                    parentTagId: parentTag.id,
                    tags: ["mutation", "tag"],
                });
                return toTagRecord(stored);
            }

            existingParentIds.add(parentTag.id);
            const nextParentIds = Array.from(existingParentIds);

            tagLogger.debug("Appending parent tag", {
                tagId,
                parentTagId: parentTag.id,
                tags: ["mutation", "tag"],
            });

            await ctx.db.merge(recordIdentifier, {
                tags: nextParentIds,
            });

            const refreshed = await ctx.db.select<RawTagRecord>(recordIdentifier);
            const reloaded = unwrapSingle(refreshed);
            const updatedRecord =
                reloaded ??
                ({
                    ...stored,
                    tags: nextParentIds,
                } satisfies RawTagRecord);

            const mapped = toTagRecord(updatedRecord);
            tagLogger.info("Parent tag appended", {
                tagId: mapped.id,
                parentTagId: parentTag.id,
                tags: ["mutation", "tag"],
            });
            return mapped;
        },
    } satisfies {
        list: () => Promise<TagRecord[]>;
        get: (slugOrId: string) => Promise<TagRecord | null>;
        upsert: (input: {
            slug: string;
            label: string;
            description?: string;
            tags?: string[];
        }) => Promise<TagRecord | null>;
        ensureMany: (
            definitions: Array<{
                slug: string;
                label: string;
                description?: string;
                tags?: string[];
            }>,
        ) => Promise<TagRecord[]>;
        getMany: (ids: string[]) => Promise<TagRecord[]>;
        addParent: (input: { tagId: string; parentTagSlug: string }) => Promise<TagRecord | null>;
    };
};
