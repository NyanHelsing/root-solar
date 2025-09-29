import assert from "node:assert/strict";
import test from "node:test";

import { Context } from "../../../../context.ts";
import { getDb } from "../../../../persistence/db.ts";

const createContext = async () => {
  const db = await getDb();
  return new Context({ db });
};

test("appending a tag to a missive persists and hydrates", async () => {
  const ctx = await createContext();
  const missives = await ctx.missives.list();
  assert.ok(missives.length > 0, "expected at least one missive to exist");
  const missiveId = missives[0]!.id;
  const uniqueSlug = `integration-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const before = await ctx.missives.get(missiveId);
  assert.ok(before, "expected missive to exist before tagging");
  assert.equal(
    before.tags.some((tag) => tag.slug === uniqueSlug),
    false,
    "tag should not exist before mutation",
  );

  const updated = await ctx.missives.addTag({ missiveId, tagSlug: uniqueSlug });
  assert.ok(updated, "addTag should return the updated missive record");
  assert.equal(
    updated.tags.some((tag) => tag.slug === uniqueSlug),
    true,
    "updated missive should contain the new tag",
  );

  const fetched = await ctx.missives.get(missiveId);
  assert.ok(fetched, "expected missive to exist after tagging");
  assert.equal(
    fetched.tags.some((tag) => tag.slug === uniqueSlug),
    true,
    "fetching the missive should include the new tag",
  );

  const allMissives = await ctx.missives.list();
  const fromList = allMissives.find((record) => record.id === missiveId);
  assert.ok(fromList, "expected missive to be present in list query");
  assert.equal(
    fromList.tags.some((tag) => tag.slug === uniqueSlug),
    true,
    "list query should include the new tag in hydrated records",
  );

  const afterRemoval = await ctx.missives.removeTag({ missiveId, tagSlug: uniqueSlug });
  assert.ok(afterRemoval, "removeTag should return the updated missive record");
  assert.equal(
    afterRemoval?.tags.some((tag) => tag.slug === uniqueSlug),
    false,
    "updated missive should no longer contain the removed tag",
  );

  const fetchedAfterRemoval = await ctx.missives.get(missiveId);
  assert.ok(fetchedAfterRemoval, "expected missive to persist after tag removal");
  assert.equal(
    fetchedAfterRemoval.tags.some((tag) => tag.slug === uniqueSlug),
    false,
    "fetching the missive should omit the removed tag",
  );
});
