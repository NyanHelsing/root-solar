import { surrealdbNodeEngines } from "@surrealdb/node";
import { RecordId, Surreal } from "surrealdb";

import { seedAxioms } from "../../data/index.ts";

const DEFAULT_DB_URL = "surrealkv://root-solar";
const DEFAULT_NAMESPACE = "root-solar";
const DEFAULT_DATABASE = "root-solar";

const DB_URL = process.env.SURREAL_DB_URL ?? DEFAULT_DB_URL;
const NAMESPACE = process.env.SURREAL_NAMESPACE ?? DEFAULT_NAMESPACE;
const DATABASE = process.env.SURREAL_DATABASE ?? DEFAULT_DATABASE;

const TABLE = "axiom" as const;

let dbPromise: Promise<Surreal> | null = null;

const ensureSeeds = async (db: Surreal) => {
  const existing = await db.select<{ id: number }>(TABLE);
  if (!existing || existing.length === 0) {
    await Promise.all(
      seedAxioms.map(async (axiom) => {
        await db.upsert(new RecordId(TABLE, axiom.id), axiom);
      }),
    );
  }
};

export const getDb = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new Surreal({
        engines: surrealdbNodeEngines(),
      });
      await db.connect(DB_URL);
      await db.use({ namespace: NAMESPACE, database: DATABASE });
      await ensureSeeds(db);
      return db;
    })();
  }
  return dbPromise;
};
