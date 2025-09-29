import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

const moduleSpecifier = "../context.ts";

describe("api/context", () => {
  it("constructs the API context with seeded models", async () => {
    const dbHandle = { kind: "db" };
    const factories = [];

    await mock.module("../persistence/entities/index.ts", {
      namedExports: {
        createTagModel(ctx) {
        factories.push({ name: "tags", ctx });
        return { type: "tag" };
      },
        createAxiomModel(ctx) {
        factories.push({ name: "axioms", ctx });
        return { type: "axiom" };
      },
        createBeingModel(ctx) {
        factories.push({ name: "beings", ctx });
        return { type: "being" };
      },
        createSentimentModel(ctx) {
        factories.push({ name: "sentiments", ctx });
        return { type: "sentiment" };
      },
        createBeingRegistrationStore(ctx) {
        factories.push({ name: "registrations", ctx });
        return { type: "registration" };
      },
        createCommentModel(ctx) {
        factories.push({ name: "comments", ctx });
        return { type: "comment" };
      },
      },
    });

    await mock.module("../persistence/db.ts", {
      namedExports: {
        async getDb() {
        return dbHandle;
      },
      },
    });

    const contextModule = await import(`${moduleSpecifier}?case=${Date.now()}-base`);
    const instance = await contextModule.createContext({});

    assert.equal(instance.db, dbHandle);
    assert.equal(instance.tags.type, "tag");
    assert.equal(instance.comments.type, "comment");
    assert.equal(instance.authRegistrations.type, "registration");
    assert.equal(factories.length >= 5, true);
    for (const entry of factories) {
      assert.equal(entry.ctx, instance);
    }

    const manual = new contextModule.Context({ db: dbHandle });
    assert.equal(manual.db, dbHandle);

    mock.restoreAll();
  });
});
