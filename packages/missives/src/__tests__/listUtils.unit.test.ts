import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SENTIMENT_TAG_SLUG } from "../constants.ts";
import { createMissiveListCopy } from "../utils/listUtils.ts";

describe("missives/listUtils", () => {
  it("provides specialized copy for the axiomatic sentiment view", () => {
    const copy = createMissiveListCopy({
      sentimentSlug: SENTIMENT_TAG_SLUG,
      sentimentLabel: "Axiomatic",
    });

    assert.equal(copy.title, "Axiomatic Alignment");
    assert.equal(copy.totalLabel, "Total axiomatic allocation");
    assert.equal(copy.emptyLabel, "No axioms marked yet.");
  });

  it("derives sentiment labels when none are supplied", () => {
    const copy = createMissiveListCopy({
      sentimentSlug: "resonant-weight",
    });

    assert.equal(copy.title, "Resonant Weight Sentiments");
    assert.equal(copy.description, "Missives filtered by participants' resonant weight sentiment weights.");
    assert.equal(copy.emptyLabel, "No missives have resonant weight weights yet.");
  });

  it("uses the active tag label when filtering by tag", () => {
    const copy = createMissiveListCopy({
      tag: { slug: "coordination", label: "Coordination" },
    });

    assert.equal(copy.title, "Missives: Coordination");
    assert.equal(copy.description, "Curated declarations filtered by the selected tag.");
  });

  it("falls back to the generic copy when no filters are applied", () => {
    const copy = createMissiveListCopy({});

    assert.equal(copy.title, "Missives");
    assert.equal(copy.loadingLabel, "Refreshing missives…");
  });
});
