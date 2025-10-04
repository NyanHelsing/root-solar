import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RecordId, StringRecordId } from "surrealdb";

import type { Context } from "../../../../context.ts";

const createTestContext = (overrides?: Partial<Context>) => {
    const ctx = {
        ...(overrides ?? {})
    } as Context;
    if (!ctx.db) {
        ctx.db = {
            select: async () => [],
            upsert: async () => [],
            query: async () => [null],
            merge: async () => []
        } as unknown as Context["db"];
    }
    if (!ctx.tags) {
        ctx.tags = {} as Context["tags"];
    }
    return ctx;
};

const extractSlug = (id: string) => id.replace(/^tag:/, "").replace(/[⟨⟩]/g, "");

describe("tag entity", () => {
    it("lists tags with stable ordering", async () => {
        const ctx = createTestContext({
            db: {
                select: async () => [
                    {
                        id: new RecordId("tag", "b"),
                        slug: "beta",
                        label: "Beta"
                    },
                    {
                        id: "tag:alpha",
                        slug: "alpha",
                        label: "Alpha"
                    }
                ]
            } as Context["db"]
        });
        const { createTagModel } = await import("../entity.ts");
        const model = createTagModel(ctx);
        const tags = await model.list();
        assert.deepEqual(
            tags.map((tag) => tag.slug),
            ["alpha", "beta"]
        );
    });

    it("fetches tags and normalises identifiers", async () => {
        let selectArgs: unknown[] | undefined;
        const ctx = createTestContext({
            db: {
                select: async (...args: unknown[]) => {
                    selectArgs = args;
                    return {
                        id: new RecordId("tag", "test"),
                        slug: "test",
                        label: "Test",
                        tags: [new RecordId("tag", "meta")]
                    };
                }
            } as Context["db"]
        });

        const { createTagModel } = await import("../entity.ts");
        const model = createTagModel(ctx);
        const record = await model.get("test");
        assert.ok(record);
        assert.equal(record?.id, "tag:test");
        assert.deepEqual(record?.tags, ["tag:meta"]);
        const identifier = selectArgs?.[0];
        assert.ok(identifier instanceof RecordId || identifier instanceof StringRecordId);

        const missingCtx = createTestContext({
            db: {
                select: async () => null
            } as Context["db"]
        });
        const missingModel = createTagModel(missingCtx);
        const missing = await missingModel.get("missing");
        assert.equal(missing, null);
    });

    it("upserts tags and returns the stored record", async () => {
        let upsertCalledWith: unknown[] | undefined;
        const ctx = createTestContext({
            db: {
                upsert: async (...args: unknown[]) => {
                    upsertCalledWith = args;
                    return {
                        id: args[0],
                        slug: "sample",
                        label: "Sample",
                        description: "desc",
                        tags: ["tag:meta"]
                    };
                }
            } as Context["db"]
        });
        const { createTagModel } = await import("../entity.ts");
        const model = createTagModel(ctx);
        const stored = await model.upsert({
            slug: "sample",
            label: "Sample",
            description: "desc",
            tags: ["tag:meta"]
        });
        assert.ok(stored);
        assert.equal(stored?.id, "tag:sample");
        assert.equal((upsertCalledWith?.[0] as RecordId)?.tb, "tag");

        const emptyCtx = createTestContext({
            db: {
                upsert: async () => []
            } as Context["db"]
        });
        const emptyModel = createTagModel(emptyCtx);
        const empty = await emptyModel.upsert({ slug: "empty", label: "Empty" });
        assert.equal(empty, null);
    });

    it("ensures tags by reusing existing definitions", async () => {
        const stored = new Map<string, { slug: string; label: string; tags?: string[] }>([
            ["existing", { slug: "existing", label: "Existing", tags: ["tag:meta"] }]
        ]);
        const ctx = createTestContext({
            db: {
                select: async (recordId: RecordId) => {
                    const slug = recordId.id as string;
                    const record = stored.get(slug);
                    if (!record) {
                        return null;
                    }
                    return {
                        id: recordId,
                        ...record
                    };
                },
                upsert: async (_recordId: RecordId, payload: unknown) => {
                    const { slug, label, tags } = payload as {
                        slug: string;
                        label: string;
                        tags?: string[];
                    };
                    stored.set(slug, { slug, label, tags });
                    return {
                        id: _recordId,
                        slug,
                        label,
                        tags
                    };
                },
                query: async () => [null]
            } as Context["db"]
        });
        const { createTagModel } = await import("../entity.ts");
        const model = createTagModel(ctx);

        const definitions = [
            { slug: "existing", label: "Existing", tags: ["tag:meta"] },
            { slug: "new", label: "New", tags: ["tag:meta"] }
        ];

        const ensured = await model.ensureMany(definitions);
        assert.equal(ensured.length, 2);
        assert.equal(stored.has("new"), true);
    });

    it("fetches multiple tags by id list", async () => {
        const records = new Map<
            string,
            { id: RecordId | StringRecordId; slug: string; label: string }
        >([
            [
                "tag:one",
                {
                    id: new RecordId("tag", "one"),
                    slug: "one",
                    label: "One"
                }
            ]
        ]);

        const ctx = createTestContext({
            db: {
                select: async (identifier: RecordId | StringRecordId) => {
                    const key = identifier.toString();
                    const record = records.get(key);
                    return record ? { ...record } : null;
                },
                query: async () => [null],
                upsert: async () => [],
                merge: async () => []
            } as Context["db"]
        });

        const { createTagModel } = await import("../entity.ts");
        const model = createTagModel(ctx);
        const many = await model.getMany(["one", "missing"]);
        assert.deepEqual(
            many.map((tag) => tag.id),
            ["tag:one"]
        );

        const none = await model.getMany([]);
        assert.deepEqual(none, []);
    });

    it("adds parent tags while ensuring definitions", async () => {
        const storedRecords = new Map<
            string,
            {
                id: RecordId | StringRecordId;
                slug: string;
                label: string;
                tags?: (string | RecordId | StringRecordId)[];
            }
        >([
            [
                "tag:child",
                {
                    id: new RecordId("tag", "child"),
                    slug: "child",
                    label: "Child",
                    tags: []
                }
            ]
        ]);

        const ctx = (() => {
            const baseCtx = createTestContext({
                db: {
                    select: async (identifier: RecordId | StringRecordId) => {
                        const record = storedRecords.get(identifier.toString());
                        if (!record) {
                            return null;
                        }
                        return {
                            ...record,
                            id: record.id,
                            tags: record.tags
                        };
                    },
                    upsert: async (identifier: RecordId, payload: unknown) => {
                        const { slug, label, tags } = payload as {
                            slug: string;
                            label: string;
                            tags?: string[];
                        };
                        const record = {
                            id: identifier,
                            slug,
                            label,
                            tags
                        };
                        storedRecords.set(identifier.toString(), record);
                        return record;
                    },
                    merge: async (
                        identifier: RecordId | StringRecordId,
                        payload: { tags: string[] }
                    ) => {
                        const existing = storedRecords.get(identifier.toString());
                        if (existing) {
                            storedRecords.set(identifier.toString(), {
                                ...existing,
                                tags: payload.tags
                            });
                        }
                        return [];
                    },
                    query: async () => [null]
                } as unknown as Context["db"]
            });
            return baseCtx;
        })();

        const { createTagModel } = await import("../entity.ts");
        const model = createTagModel(ctx);

        const updated = await model.addParent({ tagId: "child", parentTagSlug: "parent-tag" });
        assert.ok(updated);
        assert.equal(
            updated?.tags?.some((tag) => extractSlug(tag) === "parent-tag"),
            true
        );

        const storedChild = storedRecords.get("tag:child");
        assert.ok(storedChild);
        assert.deepEqual(storedChild?.tags?.map(extractSlug), ["parent-tag"]);

        const noDuplicate = await model.addParent({
            tagId: "child",
            parentTagSlug: "tag:parent-tag"
        });
        assert.ok(noDuplicate);
        assert.equal(
            noDuplicate?.tags?.filter((slug) => extractSlug(slug) === "parent-tag").length,
            1
        );
    });
});
