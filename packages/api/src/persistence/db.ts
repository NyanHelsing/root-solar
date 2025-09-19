import { surrealdbNodeEngines } from "@surrealdb/node";
import { RecordId, StringRecordId, Surreal } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import { seedAxioms } from "../data/index.ts";

const dbLogger = createAppLogger("persistence:db", {
  tags: ["persistence", "database"],
});

const DEFAULT_DB_URL = "surrealkv://root-solar";
const DEFAULT_NAMESPACE = "root-solar";
const DEFAULT_DATABASE = "root-solar";

const DB_URL = process.env.SURREAL_DB_URL ?? DEFAULT_DB_URL;
const NAMESPACE = process.env.SURREAL_NAMESPACE ?? DEFAULT_NAMESPACE;
const DATABASE = process.env.SURREAL_DATABASE ?? DEFAULT_DATABASE;

const TABLE = "axiom" as const;

let dbPromise: Promise<Surreal> | null = null;

const ensureSeeds = async (db: Surreal) => {
  dbLogger.debug("Ensuring seed axioms", {
    tags: ["seed"],
  });
  const existing = await db.select<{ id: string | RecordId }>(TABLE);
  if (!existing || existing.length === 0) {
    dbLogger.info("Seeding axioms", {
      count: seedAxioms.length,
      tags: ["seed"],
    });
    await Promise.all(
      seedAxioms.map(async ({ id, ...axiom }) => {
        await db.upsert(new StringRecordId(id), axiom);
      }),
    );
    dbLogger.info("Seed axioms inserted", {
      tags: ["seed"],
    });
  } else {
    dbLogger.debug("Seed axioms already present", {
      existingCount: existing.length,
      tags: ["seed"],
    });
  }
};

export const getDb = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      dbLogger.info("Initializing SurrealDB connection", {
        url: DB_URL,
        namespace: NAMESPACE,
        database: DATABASE,
        tags: ["startup"],
      });
      const db = new Surreal({
        engines: surrealdbNodeEngines(),
      });
      await db.connect(DB_URL);
      dbLogger.debug("Connected to SurrealDB", {
        tags: ["startup"],
      });
      await db.use({ namespace: NAMESPACE, database: DATABASE });
      dbLogger.debug("Selected namespace and database", {
        tags: ["startup"],
      });
      await ensureSeeds(db);
      dbLogger.info("SurrealDB ready", {
        tags: ["startup"],
      });
      return db;
    })();
  }
  return dbPromise;
};
