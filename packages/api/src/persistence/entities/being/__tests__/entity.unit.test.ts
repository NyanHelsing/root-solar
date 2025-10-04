import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

const moduleSpecifier = "../entity.ts";

const nanoidValues = [];

const mockNanoid = async () => {
    await mock.module("nanoid", {
        namedExports: {
            nanoid() {
                const next = nanoidValues.shift();
                if (!next) {
                    throw new Error("No nanoid value provided");
                }
                return next;
            },
        },
    });
};

afterEach(() => {
    mock.restoreAll();
    nanoidValues.length = 0;
});

describe("persistence/being", () => {
    const createContext = (overrides = {}) => ({
        db: {
            async select() {
                return [];
            },
            async upsert() {
                return {};
            },
        },
        ...overrides,
    });

    it("lists beings sorted by name", async () => {
        const records = [
            { id: "being:b", name: "Bravo" },
            { id: "being:a", name: "Alpha" },
            { id: "being:c", name: "Charlie" },
        ];

        const ctx = createContext({
            db: {
                async select() {
                    return records;
                },
            },
        });

        await mockNanoid();
        const { createBeingModel } = await import(`${moduleSpecifier}?case=${Date.now()}-list`);
        const model = createBeingModel(ctx);

        const all = await model.list();
        assert.deepEqual(
            all.map((record) => record.name),
            ["Alpha", "Bravo", "Charlie"],
        );
    });

    it("fetches beings by identifier and handles missing records", async () => {
        const ctx = createContext({
            db: {
                async select(id) {
                    const identifier = typeof id === "string" ? id : (id?.toString?.() ?? "");
                    if (identifier.includes("missing")) {
                        return [];
                    }
                    return {
                        id: "being:123",
                        name: "Being 123",
                    };
                },
            },
        });

        await mockNanoid();
        const { createBeingModel } = await import(`${moduleSpecifier}?case=${Date.now()}-get`);
        const model = createBeingModel(ctx);

        const existing = await model.get("123");
        assert.equal(existing.id, "being:123");

        const missing = await model.get("missing");
        assert.equal(missing, null);
    });

    it("creates beings with generated identifiers", async () => {
        const upsertCalls = [];
        nanoidValues.push("being-xyz");

        const ctx = createContext({
            db: {
                async upsert(_id, payload) {
                    upsertCalls.push(payload);
                    return payload;
                },
            },
        });

        await mockNanoid();
        const { createBeingModel } = await import(`${moduleSpecifier}?case=${Date.now()}-create`);
        const model = createBeingModel(ctx);

        const created = await model.create({
            name: "Example",
            signingPublicKey: "sign",
            encryptionPublicKey: "enc",
        });

        assert.equal(created.id, "being-xyz");
        assert.equal(upsertCalls[0].id, "being-xyz");
    });

    it("upserts beings and handles empty responses", async () => {
        const ctx = createContext({
            db: {
                async upsert() {
                    return [
                        {
                            id: "being:abc",
                            name: "Being ABC",
                        },
                    ];
                },
            },
        });

        const { createBeingModel } = await import(`${moduleSpecifier}?case=${Date.now()}-upsert`);
        const model = createBeingModel(ctx);

        const stored = await model.upsert({
            id: "abc",
            name: "Being ABC",
        });
        assert.equal(stored.id, "being:abc");

        const nullingCtx = createContext({
            db: {
                async upsert() {
                    return null;
                },
            },
        });

        const nullingModel = createBeingModel(nullingCtx);
        const empty = await nullingModel.upsert({ id: "abc", name: "Being ABC" });
        assert.equal(empty, null);
    });
});
