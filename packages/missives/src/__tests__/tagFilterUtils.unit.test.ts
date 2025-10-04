import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SENTIMENT_TAG_SLUG } from "../constants.ts";
import type { MissiveOverview } from "../types.ts";
import { buildTagOptions, filterMissivesByTag } from "../utils/tagFilterUtils.ts";

const createMissive = (
    id: string,
    tags: Array<{ slug: string; label?: string }>
): MissiveOverview => ({
    id,
    title: `Missive ${id}`,
    details: undefined,
    weight: 10,
    ratio: 1,
    tags: tags.map(({ slug, label }) => ({
        id: `tag:${slug}`,
        slug,
        label: label ?? "",
        tags: []
    }))
});

describe("missives/tagFilterUtils", () => {
    const missives = [
        createMissive("m-1", [{ slug: "Coordination", label: "Coordination" }]),
        createMissive("m-2", [{ slug: "momentum", label: "" }])
    ];

    it("builds tag options with sentiment defaults and sorted labels", () => {
        const options = buildTagOptions(missives, SENTIMENT_TAG_SLUG);

        assert.deepEqual(options, [
            { slug: SENTIMENT_TAG_SLUG, label: "Axiomatic" },
            { slug: "coordination", label: "Coordination" },
            { slug: "momentum", label: "Momentum" }
        ]);
    });

    it("returns all missives when no tag is active", () => {
        const filtered = filterMissivesByTag(missives, null, null);

        assert.strictEqual(filtered, missives);
    });

    it("filters missives by the requested tag", () => {
        const filtered = filterMissivesByTag(missives, "coordination", null);

        assert.equal(filtered.length, 1);
        assert.equal(filtered[0]?.id, "m-1");
    });

    it("filters missives when the label is derived", () => {
        const filtered = filterMissivesByTag(missives, "momentum", null);

        assert.equal(filtered.length, 1);
        assert.equal(filtered[0]?.id, "m-2");
    });

    it("handles tag comparisons case-insensitively", () => {
        const filtered = filterMissivesByTag(missives, "Coordination", null);

        assert.equal(filtered.length, 1);
        assert.equal(filtered[0]?.id, "m-1");
    });

    it("normalizes prefixed tag selections", () => {
        const filtered = filterMissivesByTag(missives, "tag:Coordination", null);

        assert.equal(filtered.length, 1);
        assert.equal(filtered[0]?.id, "m-1");
    });

    it("preserves the list when the sentiment filter drives the selection", () => {
        const filtered = filterMissivesByTag(missives, SENTIMENT_TAG_SLUG, SENTIMENT_TAG_SLUG);

        assert.strictEqual(filtered, missives);
    });
});
