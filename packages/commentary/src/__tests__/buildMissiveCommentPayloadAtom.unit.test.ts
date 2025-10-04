import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStore } from "jotai";

import { buildMissiveCommentPayloadAtom } from "../state/actions/buildMissiveCommentPayloadAtom.ts";

describe("commentary/buildMissiveCommentPayloadAtom", () => {
    it("creates a sanitized payload with the fallback being", () => {
        const store = createStore();
        const payload = store.set(buildMissiveCommentPayloadAtom, {
            missiveId: "missive-123",
            body: "  Hello world  "
        });

        assert.equal(payload.axiomId, "missive-123");
        assert.equal(payload.body, "Hello world");
        assert.equal(payload.authorBeingId, "guest");
        assert.equal(payload.authorDisplayName, "Guest");
        assert.equal(payload.parentCommentId, undefined);
    });

    it("requires a non-empty body", () => {
        const store = createStore();
        assert.throws(() => {
            store.set(buildMissiveCommentPayloadAtom, {
                missiveId: "missive-123",
                body: "   "
            });
        }, /Comment body cannot be empty/);
    });
});
