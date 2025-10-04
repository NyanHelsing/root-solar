import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStore } from "jotai";

import { MAX_SENTIMENT_WEIGHT, SENTIMENT_TAG_SLUG } from "../constants.ts";
import { buildMissiveSentimentPayloadAtom } from "../state/actions/buildMissiveSentimentPayloadAtom.ts";
import { activeSentimentAtom } from "../state/sentiment/activeSentimentAtom.ts";
import type { BeingSessionRecord } from "@root-solar/auth";
import { beingSessionAtom } from "@root-solar/auth";

type SessionOverrides = Partial<BeingSessionRecord> & {
    being?: Partial<BeingSessionRecord["being"]>;
    encryptedBundle?: Partial<BeingSessionRecord["encryptedBundle"]>;
};

const createSessionRecord = (overrides: SessionOverrides = {}): BeingSessionRecord => {
    const { being: beingOverrides, encryptedBundle: bundleOverrides, ...rest } = overrides;
    return {
        version: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        being: {
            id: "being-123",
            name: "Ada",
            signingPublicKey: "sign-public",
            encryptionPublicKey: "enc-public",
            ...(beingOverrides ?? {}),
        },
        encryptedBundle: {
            algorithm: "AES-GCM",
            ciphertext: "ciphertext",
            iv: "iv",
            salt: "salt",
            iterations: 1000,
            hash: "SHA-256",
            keyLength: 256,
            ...(bundleOverrides ?? {}),
        },
        ...rest,
    };
};

describe("missives/buildMissiveSentimentPayloadAtom", () => {
    it("normalizes, clamps, and annotates payloads for the active sentiment", () => {
        const store = createStore();
        store.set(beingSessionAtom, {
            type: "set",
            record: createSessionRecord(),
        });

        const context = store.set(buildMissiveSentimentPayloadAtom, {
            missiveId: "missive-1",
            tagId: `tag:${SENTIMENT_TAG_SLUG}`,
            weight: 125.4,
        });

        assert.equal(context.resolvedWeight, MAX_SENTIMENT_WEIGHT);
        assert.equal(context.payload.beingId, "being-123");
        assert.equal(context.payload.subjectId, "missive-1");
        assert.equal(context.payload.subjectTable, "missive");
        assert.equal(context.payload.tagId, `tag:${SENTIMENT_TAG_SLUG}`);
        assert.equal(context.payload.weight, MAX_SENTIMENT_WEIGHT);
        assert.equal(context.payload.maxWeight, MAX_SENTIMENT_WEIGHT);
    });

    it("rounds negative weights to zero and omits max weight for other sentiments", () => {
        const store = createStore();
        store.set(activeSentimentAtom, {
            id: "tag:coordination",
            slug: "coordination",
            filter: null,
        });

        const context = store.set(buildMissiveSentimentPayloadAtom, {
            missiveId: "missive-42",
            tagId: "tag:resonance",
            weight: -12.7,
        });

        assert.equal(context.resolvedWeight, 0);
        assert.equal(context.payload.weight, 0);
        assert.equal(context.payload.tagId, "tag:resonance");
        assert.equal(context.payload.beingId, "guest");
        assert.equal(context.payload.maxWeight, undefined);
    });
});
