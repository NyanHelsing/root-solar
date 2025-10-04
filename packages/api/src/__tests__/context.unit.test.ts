import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
    BeingModel,
    CommentModel,
    MissiveModel,
    SentimentModel,
    TagModel,
} from "../persistence/entities/index.ts";
import type { BeingRegistrationStore } from "@root-solar/auth/procedures";
import type { ContextFactories } from "../context.ts";

const moduleSpecifier = "../context.ts";

describe("api/context", () => {
    it("constructs the API context with seeded models", async () => {
        const dbHandle = { kind: "db" };
        const factories: Array<{ name: string; ctx: unknown }> = [];

        const contextModule = await import(`${moduleSpecifier}?case=${Date.now()}-base`);

        const createStub =
            <TModel>(name: string, type: string) =>
            (ctx: unknown) => {
                factories.push({ name, ctx });
                return { type } as unknown as TModel;
            };

        const stubFactories = {
            createTagModel: createStub<TagModel>("tags", "tag"),
            createMissiveModel: createStub<MissiveModel>("missives", "missive"),
            createBeingModel: createStub<BeingModel>("beings", "being"),
            createSentimentModel: createStub<SentimentModel>("sentiments", "sentiment"),
            createCommentModel: createStub<CommentModel>("comments", "comment"),
            createBeingRegistrationStore: createStub<BeingRegistrationStore>(
                "registrations",
                "registration",
            ),
        } satisfies ContextFactories;

        const instance = await contextModule.createContext({} as never, {
            getDb: async () => dbHandle,
            factories: stubFactories,
        });

        assert.equal(instance.db, dbHandle);
        assert.equal((instance.tags as unknown as { type: string }).type, "tag");
        assert.equal((instance.comments as unknown as { type: string }).type, "comment");
        assert.equal(
            (instance.authRegistrations as unknown as { type: string }).type,
            "registration",
        );
        assert.equal(factories.length >= 5, true);
        for (const entry of factories) {
            assert.equal(entry.ctx, instance);
        }

        const manual = new contextModule.Context({
            db: dbHandle,
            factories: stubFactories,
        });
        assert.equal(manual.db, dbHandle);
    });
});
