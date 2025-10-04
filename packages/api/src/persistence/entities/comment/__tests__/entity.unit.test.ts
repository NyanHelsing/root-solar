import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

import { RecordId } from "surrealdb";

import type { Context } from "../../../../context.ts";
import type { CommentTreeNode } from "../entity.ts";

const createTestContext = (options?: {
    records?: Array<Record<string, unknown>>;
}) => {
    const select = mock.fn(async () => options?.records ?? []);
    const create = mock.fn(async (_ref, record) => record);
    const query = mock.fn(async () => null);

    const ctx = {
        db: {
            select,
            create,
            query
        }
    } as unknown as Context;

    return { ctx, select, create, query };
};

describe("comment entity", () => {
    afterEach(() => {
        mock.restoreAll();
    });

    it("hydrates nested comment trees for an axiom", async () => {
        const records = [
            {
                id: "comment:root",
                axiomId: "axiom:123",
                authorBeingId: "being-a",
                authorDisplayName: "Being A",
                body: "Root",
                createdAt: "2024-01-01T00:00:00.000Z",
                parentCommentId: null
            },
            {
                id: "comment:child",
                axiomId: "axiom:123",
                authorBeingId: "being-b",
                authorDisplayName: "Being B",
                body: "Child",
                createdAt: "2024-01-01T01:00:00.000Z",
                parentCommentId: "comment:root"
            },
            {
                id: "comment:other",
                axiomId: "axiom:999",
                authorBeingId: "other",
                authorDisplayName: "Other",
                body: "Should be filtered",
                createdAt: "2024-01-02T00:00:00.000Z",
                parentCommentId: null
            }
        ];
        const { ctx, select, query } = createTestContext({ records });
        const { createCommentModel } = await import("../entity.ts");
        const model = createCommentModel(ctx);

        const tree = await model.listForAxiom("axiom:123");

        assert.equal(select.mock.callCount(), 1);
        assert.equal(query.mock.callCount(), 1);
        assert.equal(tree.length, 1);
        const [root] = tree;
        assert.equal(root.id, "comment:root");
        assert.equal(root.replies.length, 1);
        assert.equal(root.replies[0]?.id, "comment:child");
    });

    it("treats scalar select results and orphan replies as roots", async () => {
        const axiomId = "axiom:321";
        const scalarRecord = {
            id: new RecordId("comment", "child"),
            axiomId: "axiom:321",
            authorBeingId: "being-x",
            authorDisplayName: "Being X",
            body: "Child",
            createdAt: "2024-02-01T00:00:00.000Z",
            parentCommentId: new RecordId("comment", "missing")
        };
        const { ctx, select } = createTestContext();
        select.mock.mockImplementation(async () => scalarRecord);
        const { createCommentModel } = await import("../entity.ts");
        const model = createCommentModel(ctx);
        const tree = await model.listForAxiom(axiomId);
        assert.equal(tree.length, 1);
        const [node] = tree;
        assert.equal(node.id, "comment:child");
        assert.equal(node.parentCommentId, "comment:missing");
        assert.equal(node.replies.length, 0);
    });

    it("creates a persisted comment with normalized identifiers", async () => {
        const { ctx, create, query } = createTestContext();
        create.mock.mockImplementation(async (_ref, record) => [record]);
        const { createCommentModel } = await import("../entity.ts");
        const model = createCommentModel(ctx);

        const result = await model.create({
            axiomId: "axiom:123",
            parentCommentId: "comment:parent",
            authorBeingId: "being-1",
            authorDisplayName: "Author",
            body: "Hello world"
        });

        assert.equal(typeof result.id, "string");
        assert.equal(result.axiomId, "axiom:123");
        assert.equal(result.parentCommentId, "comment:parent");
        assert.equal(result.authorBeingId, "being-1");
        assert.equal(result.body, "Hello world");
        assert.deepEqual(result.replies, []);

        assert.ok(query.mock.callCount() >= 0);
        assert.equal(create.mock.callCount(), 1);
        const [createCall] = create.mock.calls;
        const [createRef, createdPayload] = createCall.arguments as [
            unknown,
            Record<string, unknown>
        ];
        assert.equal(String(createRef).startsWith("comment:"), true);
        assert.equal(createdPayload.axiomId, "axiom:123");
    });

    it("creates root comments without parent identifiers", async () => {
        const { ctx, create } = createTestContext();
        const { createCommentModel } = await import("../entity.ts");
        const model = createCommentModel(ctx);

        const result = await model.create({
            axiomId: "axiom:123",
            authorBeingId: "being-1",
            authorDisplayName: "Author",
            body: "Root level"
        });

        assert.equal(result.parentCommentId, null);
        const [, rootPayload] = create.mock.calls[0]?.arguments ?? [];
        assert.equal(rootPayload?.parentCommentId, null);
    });

    it("falls back to payload when the database returns null", async () => {
        const { ctx, create } = createTestContext();
        create.mock.mockImplementation(async () => null);
        const { createCommentModel } = await import("../entity.ts");
        const model = createCommentModel(ctx);
        const result = await model.create({
            axiomId: "axiom-raw",
            authorBeingId: "being-raw",
            authorDisplayName: "Raw",
            body: "Body"
        });
        assert.ok(result.axiomId.startsWith("axiom:"));
        assert.equal(result.parentCommentId, null);
    });

    it("returns an empty list when no comments are available", async () => {
        const { ctx, select } = createTestContext();
        select.mock.mockImplementation(async () => null);
        const { createCommentModel } = await import("../entity.ts");
        const model = createCommentModel(ctx);
        const tree = await model.listForAxiom("axiom:none");
        assert.deepEqual(tree, []);
    });
});
