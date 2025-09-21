import { surrealdbNodeEngines } from "@surrealdb/node";
import { RecordId, StringRecordId, Surreal } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import { seedMissives } from "../data/index.ts";

const dbLogger = createAppLogger("persistence:db", {
  tags: ["persistence", "database"],
});

const DEFAULT_DB_URL = "surrealkv://root-solar";
const DEFAULT_NAMESPACE = "root-solar";
const DEFAULT_DATABASE = "root-solar";

const DB_URL = process.env.SURREAL_DB_URL ?? DEFAULT_DB_URL;
const NAMESPACE = process.env.SURREAL_NAMESPACE ?? DEFAULT_NAMESPACE;
const DATABASE = process.env.SURREAL_DATABASE ?? DEFAULT_DATABASE;

const MISSIVE_TABLE = "missive" as const;
const LEGACY_AXIOM_TABLE = "axiom" as const;

let dbPromise: Promise<Surreal> | null = null;

const ensureSeeds = async (db: Surreal) => {
  dbLogger.debug("Ensuring seed missives", {
    tags: ["seed"],
  });

  const migrateLegacyAxioms = async () => {
    const legacyAxioms = await db.select<{ id: string | RecordId; title: string }>(
      LEGACY_AXIOM_TABLE,
    );
    if (!legacyAxioms || legacyAxioms.length === 0) {
      return false;
    }
    dbLogger.info("Migrating legacy axioms into missive table", {
      count: legacyAxioms.length,
      tags: ["seed", "migration"],
    });
    await Promise.all(
      legacyAxioms.map(async ({ id, ...record }) => {
        const normalizedId = typeof id === "string" ? id : id.toString();
        const missiveId = normalizedId.startsWith("missive:")
          ? normalizedId
          : normalizedId.replace(/^axiom:/, "missive:");
        await db.upsert(new StringRecordId(missiveId), {
          ...record,
          kind: (record as { kind?: string }).kind ?? "axiom",
        });
      }),
    );
    return true;
  };

  let existing = await db.select<{ id: string | RecordId }>(MISSIVE_TABLE);
  if (!existing || existing.length === 0) {
    const migrated = await migrateLegacyAxioms();
    if (migrated) {
      existing = await db.select<{ id: string | RecordId }>(MISSIVE_TABLE);
    }
  }

  if (!existing || existing.length === 0) {
    dbLogger.info("Seeding missives", {
      count: seedMissives.length,
      tags: ["seed"],
    });
    await Promise.all(
      seedMissives.map(async ({ id, ...missive }) => {
        await db.upsert(new StringRecordId(id), missive);
      }),
    );
    dbLogger.info("Seed missives inserted", {
      tags: ["seed"],
    });
  } else {
    dbLogger.debug("Seed missives already present", {
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
