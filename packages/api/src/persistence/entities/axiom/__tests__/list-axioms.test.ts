import test from "node:test";
import assert from "node:assert/strict";

import { Context } from "../../../../context.ts";
import { getDb } from "../../../../persistence/db.ts";

const createContext = async () => {
    const db = await getDb();
    return new Context({ db });
};

test("lists axiomatic missives when filtering by axiomatic sentiment", async () => {
    const ctx = await createContext();
    const bySlug = await ctx.missives.list({ sentimentSlug: "axiomatic" });
    assert.ok(
        bySlug.length > 0,
        "expected at least one missive to be returned when filtering by axiomatic sentiment"
    );

    const byTagId = await ctx.missives.list({ sentimentSlug: "tag:axiomatic" });
    assert.ok(byTagId.length > 0, "expected tag-prefixed sentiment filters to return missives");
});
