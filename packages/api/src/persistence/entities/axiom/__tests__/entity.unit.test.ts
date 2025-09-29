import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RecordId, StringRecordId } from "surrealdb";

import type { Context } from "../../../../context.ts";
import type { TagRecord } from "../../index.ts";

const createTestContext = (overrides?: Partial<Context>) => {
  const selectCalls: unknown[] = [];
  const createCalls: unknown[] = [];
  const ctx: Context = {
    ...(overrides ?? {}),
  } as Context;
  if (!ctx.db) {
    const select = async (...args: unknown[]) => {
      selectCalls.push(args);
      return [];
    };
    const create = async (...args: unknown[]) => {
      createCalls.push(args);
      return [];
    };
    ctx.db = {
      select,
      create,
    } as unknown as Context["db"];
  }
  if (!ctx.tags) {
    ctx.tags = {
      getMany: async () => [],
      ensureMany: async () => [],
    } as unknown as Context["tags"];
  }
  return { ctx, selectCalls, createCalls };
};

describe("axiom entity", () => {
  it("lists axioms sorted and filtered by sentiment", async () => {
    let collectedTagIds: string[] = [];
    const tagRecords: TagRecord[] = [
      {
        id: "tag:axiom",
        slug: "axiom",
        label: "Axiom",
        tags: [],
      },
      {
        id: "tag:axiomatic",
        slug: "axiomatic",
        label: "Axiomatic",
        tags: [],
      },
    ];

    const { ctx } = createTestContext({
      db: {
        select: async () => [
          {
            id: new RecordId("missive", "b"),
            title: "Beta",
            tags: [new RecordId("tag", "axiom")],
          },
          {
            id: "missive:a",
            title: "Alpha",
            tags: ["tag:axiomatic"],
          },
          {
            id: "missive:c",
            title: "Gamma",
            tags: ["tag:unrelated"],
          },
        ],
      } as Context["db"],
      tags: {
        getMany: async (ids: string[]) => {
          collectedTagIds = ids;
          return tagRecords;
        },
        ensureMany: async () => [],
      } as Context["tags"],
    });

    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);

    const all = await model.list();
    assert.deepEqual(all.map((record) => record.title), ["Alpha", "Beta", "Gamma"]);
    assert.equal(collectedTagIds.includes("tag:axiom"), true);

    const filtered = await model.list({ sentimentSlug: "axiomatic" });
    assert.deepEqual(filtered.map((record) => record.title), ["Alpha", "Beta"]);
  });

  it("fetches a single axiom record by id", async () => {
    const storedRecord = {
      id: new RecordId("missive", "abc"),
      title: "Example",
      details: "Details",
      tags: ["tag:axiomatic"],
    };

    let selectCount = 0;

    const { ctx } = createTestContext({
      db: {
        select: async () => {
          selectCount += 1;
          return [storedRecord];
        },
      } as Context["db"],
      tags: {
        getMany: async () => [
          {
            id: "tag:axiomatic",
            slug: "axiomatic",
            label: "Axiomatic",
            tags: [],
          },
        ],
        ensureMany: async () => [],
      } as Context["tags"],
    });

    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);

    const record = await model.get("missive:abc");
    assert.ok(record);
    assert.equal(record?.id, "missive:abc");
    assert.equal(record?.tags[0]?.slug, "axiomatic");
    assert.equal(selectCount, 1);

    const { ctx: missingCtx } = createTestContext({
      db: {
        select: async () => null,
      } as Context["db"],
      tags: {
        getMany: async () => [],
        ensureMany: async () => [],
      } as Context["tags"],
    });
    const missingModel = createAxiomModel(missingCtx);
    const missing = await missingModel.get("missive:missing");
    assert.equal(missing, null);
  });

  it("retries axiom creation on duplicate ids", async () => {
    const ensuredTags: string[][] = [];
    const ensuredLabels: string[][] = [];
    let attempt = 0;

    const createdRecords: { id: string; title: string; tags?: string[] }[] = [];

    const { ctx } = createTestContext({
      db: {
        create: async (_recordId: RecordId, payload: unknown) => {
          attempt += 1;
          if (attempt === 1) {
            throw new Error("already exists");
          }
          const { title, details, tags } = payload as {
            title: string;
            details?: string;
            tags?: string[];
          };
          const stored = {
            id: _recordId,
            title,
            details,
            tags,
          } satisfies Record<string, unknown>;
          createdRecords.push({ id: String(_recordId), title, tags });
          return stored;
        },
        select: async () => [],
      } as unknown as Context["db"],
      tags: {
        ensureMany: async (
          definitions: Array<{ slug: string; label: string }>,
        ) => {
          ensuredTags.push(definitions.map((definition) => definition.slug));
          ensuredLabels.push(definitions.map((definition) => definition.label));
          return definitions.map((definition) => ({
            id: `tag:${definition.slug}`,
            slug: definition.slug,
            label: definition.slug,
          })) as TagRecord[];
        },
        getMany: async (ids: string[]) =>
          ids.map((id) => ({
            id,
            slug: id.split(":").slice(1).join(":"),
            label: id,
          })) as TagRecord[],
      } as Context["tags"],
    });

    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);

    const created = await model.create({
      title: "New Axiom",
      details: "Details",
      tagSlugs: ["axiomatic"],
    });

    assert.equal(created.title, "New Axiom");
    assert.equal(created.tags[0]?.slug, "axiomatic");
    assert.equal(attempt >= 2, true);
    assert.deepEqual(ensuredTags[0], ["axiomatic"]);
    assert.deepEqual(ensuredLabels[0], ["Axiomatic"]);
    assert.equal(createdRecords.length, 1);
  });

  it("generates labels for unknown tag slugs", async () => {
    const definitions: Array<{ slug: string; label: string }> = [];
    const { ctx } = createTestContext({
      db: {
        create: async (_recordId: RecordId, payload: unknown) => ({
          ...(payload as Record<string, unknown>),
          id: _recordId,
        }),
        select: async () => [],
      } as unknown as Context["db"],
      tags: {
        ensureMany: async (defs: Array<{ slug: string; label: string }>) => {
          definitions.push(...defs);
          return defs.map((def) => ({
            id: `tag:${def.slug}`,
            slug: def.slug,
            label: def.label,
          })) as TagRecord[];
        },
        getMany: async () => [],
      } as Context["tags"],
    });
    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);
    await model.create({
      title: "Custom",
      tagSlugs: ["custom-tag"],
    });
    assert.equal(definitions[0]?.label, "Custom Tag");
  });

  it("throws when the database returns no record", async () => {
    const { ctx } = createTestContext({
      db: {
        create: async () => null,
        select: async () => [],
      } as unknown as Context["db"],
      tags: {
        ensureMany: async () => [],
        getMany: async () => [],
      } as Context["tags"],
    });
    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);
    await assert.rejects(
      model.create({ title: "Broken" }),
      /returned empty record/,
    );
  });

  it("propagates unexpected creation errors", async () => {
    const { ctx } = createTestContext({
      db: {
        create: async () => {
          throw "boom";
        },
        select: async () => [],
      } as unknown as Context["db"],
      tags: {
        ensureMany: async () => [],
        getMany: async () => [],
      } as Context["tags"],
    });
    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);
    await assert.rejects(async () => {
      await model.create({ title: "Error" });
    }, /boom/);
  });

  it("returns an empty list when no records exist", async () => {
    const { ctx } = createTestContext({
      db: {
        select: async () => [],
      } as Context["db"],
      tags: {
        getMany: async () => [],
      } as Context["tags"],
    });
    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);
    const result = await model.list();
    assert.deepEqual(result, []);
  });

  it("collects tag ids from RecordId instances", async () => {
    const recordTag = new RecordId("tag", "axiom");
    const { ctx } = createTestContext({
      db: {
        select: async () => [
          {
            id: "missive:1",
            title: "Title",
            tags: [recordTag],
          },
        ],
      } as Context["db"],
      tags: {
        getMany: async (ids: string[]) =>
          ids.map((id) => ({ id, slug: id.split(":").slice(1).join(":"), label: id })) as TagRecord[],
      } as Context["tags"],
    });
    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);
    const result = await model.list();
    assert.equal(result[0]?.tags[0]?.id, recordTag.toString());
  });

  it("normalises tag inputs when appending to a missive", async () => {
    const ensuredSlugs: string[] = [];
    const updateParams: Array<Record<string, unknown>> = [];
    let selectCount = 0;

    const { ctx } = createTestContext({
      db: {
        select: async () => {
          selectCount += 1;
          if (selectCount === 1) {
            return [
              {
                id: "missive:1",
                title: "Existing",
                tags: ["tag:existing"],
              },
            ];
          }
          return [];
        },
        query: async (_statement: string, params: Record<string, unknown>) => {
          updateParams.push(params);
          return [];
        },
      } as unknown as Context["db"],
      tags: {
        ensureMany: async (definitions: Array<{ slug: string; label: string; tags: string[] }>) => {
          ensuredSlugs.push(...definitions.map((definition) => definition.slug));
          return definitions.map((definition) => ({
            id: `tag:${definition.slug}`,
            slug: definition.slug,
            label: definition.label,
            tags: definition.tags,
          })) as TagRecord[];
        },
        getMany: async (ids: string[]) =>
          ids.map((id) => ({
            id,
            slug: id.split(":").slice(1).join(":"),
            label: id,
            tags: [],
          })) as TagRecord[],
      } as unknown as Context["tags"],
    });

    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);

    const record = await model.addTag({ missiveId: "missive:1", tagSlug: "tag:New" });

    assert.ok(record);
    assert.equal(record?.tags.some((tag) => tag.slug === "new"), true);
    assert.deepEqual(ensuredSlugs, ["new"]);
    assert.equal(updateParams[0]?.tags ? Array.isArray(updateParams[0]?.tags) : false, true);
    assert.deepEqual(updateParams[0]?.tags, ["tag:existing", "tag:new"]);
  });

  it("removes tags from a missive", async () => {
    const mergePayloads: Array<Record<string, unknown>> = [];

    const storedRecord = {
      id: new RecordId("missive", "1"),
      title: "Existing",
      tags: ["tag:keep", "tag:remove"],
    } satisfies Record<string, unknown>;

    const { ctx } = createTestContext({
      db: {
        select: async () => [storedRecord],
        merge: async (_id: RecordId | StringRecordId, payload: Record<string, unknown>) => {
          mergePayloads.push(payload);
          storedRecord.tags = payload.tags as string[];
          return [];
        },
      } as unknown as Context["db"],
      tags: {
        ensureMany: async () => [],
        getMany: async () => [],
      } as Context["tags"],
    });

    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);

    const updated = await model.removeTag({ missiveId: "missive:1", tagSlug: "remove" });

    assert.ok(updated);
    assert.equal(updated?.tags.some((tag) => tag.slug === "remove"), false);
    assert.deepEqual(mergePayloads[0], { tags: ["tag:keep"] });
  });

  it("throws after exhausting id allocation attempts", async () => {
    const { ctx } = createTestContext({
      db: {
        create: async () => {
          throw new Error("already exists");
        },
        select: async () => [],
      } as unknown as Context["db"],
      tags: {
        ensureMany: async () => [],
        getMany: async () => [],
      } as Context["tags"],
    });
    const { createAxiomModel } = await import("../entity.ts");
    const model = createAxiomModel(ctx);
    await assert.rejects(
      model.create({ title: "Duplicate" }),
      /Unable to allocate unique id/,
    );
  });

});
