import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

const dataConfig = {
    seedTags: [],
    seedMissives: [],
};

let currentDb: ReturnType<typeof createFakeDb> | undefined;

class MockRecordId {
    constructor(table, id) {
        this.table = table;
        this.id = id;
    }
    toString() {
        return `${this.table}:${this.id}`;
    }
}

class MockStringRecordId {
    constructor(id) {
        this.id = id;
    }
    toString() {
        return this.id;
    }
}

const setupDbMocks = async () => {
    await mock.module("@surrealdb/node", {
        namedExports: {
            surrealdbNodeEngines() {
                return {};
            },
        },
    });

    await mock.module("surrealdb", {
        namedExports: {
            RecordId: MockRecordId,
            StringRecordId: MockStringRecordId,
            Surreal: function Surreal() {
                if (!currentDb) {
                    throw new Error("currentDb not configured");
                }
                return currentDb;
            },
        },
    });

    await mock.module("../../data/index.ts", {
        namedExports: {
            get seedTags() {
                return dataConfig.seedTags;
            },
            get seedMissives() {
                return dataConfig.seedMissives;
            },
        },
    });
};

const createFakeDb = () => {
    const connectUrls = [];
    const namespaces = [];
    const selectCalls = [];
    const upsertCalls = [];
    const queryCalls = [];

    return {
        connectUrls,
        namespaces,
        selectCalls,
        upsertCalls,
        queryCalls,
        async connect(url) {
            connectUrls.push(url);
        },
        async use(options) {
            namespaces.push(options);
        },
        async select(...args) {
            selectCalls.push(args);
            return [];
        },
        async upsert(id, value) {
            const identifier = typeof id === "string" ? id : (id?.toString?.() ?? String(id));
            upsertCalls.push({ id: identifier, value });
            return value;
        },
        async query(text, params) {
            queryCalls.push({ text, params });
            return [];
        },
    };
};

afterEach(() => {
    mock.restoreAll();
    dataConfig.seedTags = [];
    dataConfig.seedMissives = [];
    currentDb = undefined;
});

describe("persistence/db", () => {
    it("initializes the database and seeds missing data", async () => {
        const fakeDb = createFakeDb();
        currentDb = fakeDb;

        await setupDbMocks();

        dataConfig.seedTags = [{ slug: "axiom", label: "Axiom", tags: [] }];
        dataConfig.seedMissives = [{ id: "missive:seed", title: "Seed", tagSlugs: ["axiom"] }];

        fakeDb.select = async (...args) => {
            fakeDb.selectCalls.push(args);
            const [table] = args;
            if (table === "missive" || table === "axiom") {
                return [];
            }
            return [];
        };

        const { getDb } = await import(`../db.ts?case=${Date.now()}-seed`);
        const db = await getDb();

        assert.equal(db, fakeDb);
        assert.equal(fakeDb.connectUrls.length > 0, true);
        assert.match(fakeDb.connectUrls[0], /^surrealkv:\/\//);
        assert.deepEqual(fakeDb.namespaces[0], {
            namespace: "root-solar",
            database: "root-solar",
        });
        assert.equal(
            fakeDb.upsertCalls.length,
            dataConfig.seedTags.length + dataConfig.seedMissives.length,
        );
    });

    it("migrates legacy axioms and ensures missive tags", async () => {
        const fakeDb = createFakeDb();
        currentDb = fakeDb;

        await setupDbMocks();

        dataConfig.seedTags = [];
        dataConfig.seedMissives = [];

        let missiveSelectCount = 0;

        fakeDb.select = async (...args) => {
            fakeDb.selectCalls.push(args);
            const [table] = args;
            if (table === "missive") {
                missiveSelectCount += 1;
                if (missiveSelectCount === 1) {
                    return [];
                }
                if (missiveSelectCount === 2) {
                    return [{ id: "missive:legacy" }];
                }
                return [
                    {
                        id: "missive:legacy",
                        tags: ["tag:other"],
                        kind: "axiom",
                    },
                ];
            }
            if (table === "axiom") {
                return [
                    {
                        id: "axiom:legacy",
                        title: "Legacy",
                        kind: "axiom",
                    },
                ];
            }
            return [];
        };

        const { getDb } = await import(`../db.ts?case=${Date.now()}-migrate`);
        await getDb();

        const ids = fakeDb.upsertCalls.map((call) => call.id);
        assert.equal(ids.includes("missive:legacy"), true);

        const query = fakeDb.queryCalls[0];
        assert.equal(query.text.includes("UPDATE"), true);
        assert.equal(query.params.tags[0], "tag:axiomatic");
        assert.deepEqual(
            new Set(query.params.tags),
            new Set(["tag:axiomatic", "tag:axiom", "tag:other"]),
        );
    });

    it("returns the same connection on subsequent calls", async () => {
        const fakeDb = createFakeDb();
        currentDb = fakeDb;

        await setupDbMocks();

        fakeDb.select = async (...args) => {
            fakeDb.selectCalls.push(args);
            return [];
        };

        const { getDb } = await import(`../db.ts?case=${Date.now()}-cache`);
        const first = await getDb();
        const second = await getDb();
        assert.equal(first, second);
        assert.equal(fakeDb.connectUrls.length, 1);
    });

    it("skips missive tag updates when none are returned", async () => {
        const fakeDb = createFakeDb();
        currentDb = fakeDb;

        await setupDbMocks();

        dataConfig.seedTags = [];
        dataConfig.seedMissives = [];

        let missiveSelectCount = 0;

        fakeDb.select = async (...args) => {
            fakeDb.selectCalls.push(args);
            const [table] = args;
            if (table === "missive") {
                missiveSelectCount += 1;
                if (missiveSelectCount === 1) {
                    return [{ id: "missive:existing" }];
                }
                return null;
            }
            return [];
        };

        const { getDb } = await import(`../db.ts?case=${Date.now()}-skip-tags`);
        await getDb();

        assert.equal(fakeDb.queryCalls.length, 0);
    });
});
