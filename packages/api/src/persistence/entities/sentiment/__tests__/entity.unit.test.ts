import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RecordId, StringRecordId } from "surrealdb";

import type { Context } from "../../../../context.ts";
import type { TagRecord } from "../../index.ts";

const defaultTag: TagRecord = {
    id: "tag:focus",
    slug: "focus",
    label: "Focus",
    tags: ["tag:sentimental"]
};

describe("sentiment entity", () => {
    const createBaseContext = () => {
        const queryResults: unknown[][] = [];
        const queryCalls: unknown[] = [];
        const upsertCalls: unknown[] = [];
        const deleteCalls: unknown[] = [];
        const selectResponses: unknown[] = [];

        const ctx: Context = {
            db: {
                query: async (...args: unknown[]) => {
                    queryCalls.push(args);
                    return queryResults.shift() ?? [null];
                },
                upsert: async (...args: unknown[]) => {
                    upsertCalls.push(args);
                    return {
                        id: (args[1] as { id: string }).id,
                        beingId: (args[1] as { beingId: string }).beingId,
                        subjectId: (args[1] as { subjectId: string }).subjectId,
                        subjectTable: (args[1] as { subjectTable: string }).subjectTable,
                        tagId: (args[1] as { tagId: string }).tagId,
                        weight: (args[1] as { weight: number }).weight
                    } satisfies Record<string, unknown>;
                },
                delete: async (...args: unknown[]) => {
                    deleteCalls.push(args);
                },
                select: async (...args: unknown[]) => selectResponses.shift() ?? null
            } as unknown as Context["db"],
            tags: {
                getMany: async () => [defaultTag],
                get: async () => defaultTag,
                upsert: async () => defaultTag
            } as unknown as Context["tags"],
            beings: {
                create: async () => ({ id: "being-created" })
            } as unknown as Context["beings"]
        };

        return {
            ctx,
            queryResults,
            queryCalls,
            upsertCalls,
            deleteCalls,
            selectResponses
        };
    };

    it("upserts sentiments and calculates ratios", async () => {
        const helpers = createBaseContext();
        const { ctx, queryResults, selectResponses } = helpers;

        const sentimentId = "being:1:tag:focus:missive:subject-1";
        queryResults.push([
            {
                status: "OK",
                result: [
                    {
                        id: sentimentId,
                        beingId: "being:1",
                        subjectId: "subject-1",
                        subjectTable: "missive",
                        tagId: "tag:focus",
                        weight: 3
                    },
                    {
                        id: "other",
                        beingId: "being:1",
                        subjectId: "subject-2",
                        subjectTable: "missive",
                        tagId: "tag:focus",
                        weight: 2
                    }
                ]
            }
        ]);

        selectResponses.push({ id: new StringRecordId("being:1"), name: "existing" });

        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);

        const allocation = await model.upsert({
            beingId: "being:1",
            subjectId: "subject-1",
            tagId: "tag:focus",
            weight: 4,
            maxWeight: 10
        });

        assert.ok(allocation);
        assert.equal(allocation?.ratio.toFixed(2), "0.67");
        assert.equal(allocation?.totalWeightForTag, 6);
        assert.equal(allocation?.maxWeight, 10);
        assert.equal(allocation?.tag?.slug, "focus");
        assert.equal(helpers.upsertCalls.length, 1);
    });

    it("rejects invalid weight allocations", async () => {
        const helpers = createBaseContext();
        const { ctx, queryResults } = helpers;
        queryResults.push([
            {
                status: "OK",
                result: [
                    {
                        id: "existing",
                        beingId: "being:1",
                        subjectId: "missive:2",
                        subjectTable: "missive",
                        tagId: "tag:focus",
                        weight: 8
                    }
                ]
            }
        ]);
        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);

        await assert.rejects(
            model.upsert({
                beingId: "being:1",
                subjectId: "subject-1",
                tagId: "tag:focus",
                weight: 4,
                maxWeight: 10
            }),
            /exceeds allocation/
        );

        await assert.rejects(
            model.upsert({
                beingId: "being:1",
                subjectId: "missive:1",
                tagId: "tag:focus",
                weight: 1.5
            }),
            /integer/
        );

        await assert.rejects(
            model.upsert({
                beingId: "being:1",
                subjectId: "missive:1",
                tagId: "tag:focus",
                weight: -1
            }),
            /must be non-negative/
        );

        await assert.rejects(
            model.upsert({
                beingId: "being:1",
                subjectId: "subject-1",
                tagId: "tag:focus",
                weight: 1,
                maxWeight: -2
            }),
            /must be non-negative/
        );
    });

    it("removes sentiments when weight is zero", async () => {
        const helpers = createBaseContext();
        const { ctx, queryResults, deleteCalls } = helpers;
        queryResults.push([
            {
                status: "OK",
                result: []
            }
        ]);
        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);

        const result = await model.upsert({
            beingId: "being:1",
            subjectId: "subject-1",
            tagId: "tag:focus",
            weight: 0
        });

        assert.equal(result, null);
        assert.equal(deleteCalls.length, 1);
        const [deleteArg] = deleteCalls[0] as [RecordId];
        assert.ok(deleteArg instanceof RecordId);
    });

    it("creates missing beings and tags during upsert", async () => {
        const helpers = createBaseContext();
        const { ctx, queryResults, selectResponses } = helpers;
        queryResults.push([
            {
                status: "OK",
                result: []
            }
        ]);
        selectResponses.push(null);

        ctx.tags = {
            getMany: async () => [defaultTag],
            get: async () => null,
            upsert: async () => defaultTag
        } as unknown as Context["tags"];

        const creations: unknown[] = [];
        ctx.beings = {
            create: async (input: unknown) => {
                creations.push(input);
                return { id: "being:new" };
            }
        } as Context["beings"];

        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);
        const allocation = await model.upsert({
            beingId: "being:missing",
            subjectId: "subject-1",
            tagId: "tag:focus",
            weight: 2
        });
        assert.ok(allocation);
        assert.equal(creations.length, 1);
    });

    it("lists sentiments for a being with ratios", async () => {
        const helpers = createBaseContext();
        const { ctx, queryResults } = helpers;

        queryResults.push([
            [
                {
                    id: "being:1:tag:focus:missive:1",
                    beingId: "being:1",
                    subjectId: "missive:1",
                    subjectTable: "missive",
                    tagId: "tag:focus",
                    weight: 3
                },
                {
                    id: "being:1:tag:focus:missive:2",
                    beingId: "being:1",
                    subjectId: "missive:2",
                    subjectTable: "missive",
                    tagId: "tag:focus",
                    weight: 1
                }
            ]
        ]);

        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);
        const allocations = await model.listForBeing("being:1");
        assert.equal(allocations.length, 2);
        assert.equal(allocations[0]?.totalWeightForTag, 4);
        assert.equal(allocations[0]?.ratio, 0.75);
    });

    it("returns empty allocations when select results are invalid", async () => {
        const helpers = createBaseContext();
        const { ctx, queryResults } = helpers;
        queryResults.push([
            {
                status: "ERR"
            }
        ]);

        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);
        const allocations = await model.listForBeing("being:1");
        assert.deepEqual(allocations, []);

        queryResults.push([null]);
        const emptyResult = await model.listForBeing("being:1", { tagId: "tag:focus" });
        assert.deepEqual(emptyResult, []);

        queryResults.push([
            {
                status: "OK",
                result: undefined
            }
        ]);
        const unexpectedShape = await model.listForBeing("being:1", { subjectTable: "custom" });
        assert.deepEqual(unexpectedShape, []);
    });

    it("removes sentiments by identifier", async () => {
        const helpers = createBaseContext();
        const { ctx, deleteCalls } = helpers;
        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);
        await model.remove({
            beingId: "being:1",
            subjectId: "missive:7",
            tagId: "tag:focus"
        });
        assert.equal(deleteCalls.length, 1);
        const [identifier] = deleteCalls[0] as [RecordId];
        assert.equal(identifier.tb, "sentiment");
    });

    it("returns null when upsert yields no stored record", async () => {
        const helpers = createBaseContext();
        const { ctx, queryResults, selectResponses } = helpers;
        queryResults.push([
            {
                status: "OK",
                result: []
            }
        ]);
        selectResponses.push({ id: new StringRecordId("being:fixture") });
        ctx.db = {
            ...ctx.db,
            upsert: async () => null
        } as Context["db"];
        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);
        const result = await model.upsert({
            beingId: "being:fixture",
            subjectId: "subject-1",
            tagId: "tag:focus",
            weight: 2
        });
        assert.equal(result, null);
    });

    it("throws when ensuring a tag cannot create an entry", async () => {
        const helpers = createBaseContext();
        const { ctx, queryResults, selectResponses } = helpers;
        queryResults.push([
            {
                status: "OK",
                result: []
            }
        ]);
        selectResponses.push({ id: new StringRecordId("being:oops") });

        ctx.tags = {
            getMany: async () => [defaultTag],
            get: async () => null,
            upsert: async () => null
        } as unknown as Context["tags"];

        const { createSentimentModel } = await import("../entity.ts");
        const model = createSentimentModel(ctx);
        await assert.rejects(
            model.upsert({
                beingId: "being:oops",
                subjectId: "subject-1",
                tagId: "tag:new",
                weight: 1
            }),
            /Failed to ensure tag/
        );
    });
});
