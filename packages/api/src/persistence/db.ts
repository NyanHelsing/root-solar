import { surrealdbNodeEngines } from "@surrealdb/node";
import { RecordId, Surreal } from "surrealdb";

import { nanoid } from "nanoid";
import { createAppLogger } from "@root-solar/observability";
import { loadSeedMissives } from "../data/index.ts";
import type { MissiveRecord } from "./entities/index.ts";

const dbLogger = createAppLogger("persistence:db", {
  tags: ["persistence", "database"],
});

const DEFAULT_DB_URL = "surrealkv://root-solar";
const DEFAULT_NAMESPACE = "root-solar";
const DEFAULT_DATABASE = "root-solar";

const DB_URL = process.env.SURREAL_DB_URL ?? DEFAULT_DB_URL;
const NAMESPACE = process.env.SURREAL_NAMESPACE ?? DEFAULT_NAMESPACE;
const DATABASE = process.env.SURREAL_DATABASE ?? DEFAULT_DATABASE;

const TABLE = "missive" as const;

const sanitizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const resolveSeedIdentifier = (
  missive: MissiveRecord,
): { recordId: RecordId; id: string; slug: string } => {
  const parseExistingId = () => {
    if (!missive.id) {
      return null;
    }
    const trimmed = missive.id.trim();
    if (!trimmed || !trimmed.startsWith(`${TABLE}:`)) {
      return null;
    }

    const remainder = trimmed.slice(`${TABLE}:`.length);
    if (!remainder) {
      return null;
    }

    const legacyParts = remainder.split(":");
    if (legacyParts.length >= 2) {
      const [kind, ...rest] = legacyParts;
      const slugSource = rest.length > 0
        ? rest.join(":")
        : missive.slug ?? missive.title ?? remainder;
      const normalizedSlug = sanitizeSlug(slugSource);
      const resolvedSlug = normalizedSlug.length > 0
        ? normalizedSlug
        : nanoid().toLowerCase();
      const identifier = `${kind}_${resolvedSlug}`;
      return {
        recordId: new RecordId(TABLE, identifier),
        id: `missive:${identifier}`,
        slug: resolvedSlug,
      } as const;
    }

    const underscoreIndex = remainder.indexOf("_");
    if (underscoreIndex === -1) {
      return null;
    }

    const kind = remainder.slice(0, underscoreIndex);
    const slugPart = remainder.slice(underscoreIndex + 1);
    const normalizedSlug = sanitizeSlug(slugPart);
    const resolvedSlug = normalizedSlug.length > 0
      ? normalizedSlug
      : nanoid().toLowerCase();
    const identifier = `${kind}_${resolvedSlug}`;
    return {
      recordId: new RecordId(TABLE, identifier),
      id: `missive:${identifier}`,
      slug: resolvedSlug,
    } as const;
  };

  const existing = parseExistingId();
  if (existing) {
    return existing;
  }

  const baseSlug = sanitizeSlug(missive.slug ?? missive.title ?? "");
  const fallbackSlug = baseSlug.length > 0 ? baseSlug : nanoid().toLowerCase();
  const identifier = `${missive.kind}_${fallbackSlug}`;
  const recordId = new RecordId(TABLE, identifier);
  return {
    recordId,
    id: recordId.toString(),
    slug: fallbackSlug,
  };
};

let dbPromise: Promise<Surreal> | null = null;

const ensureSeeds = async (db: Surreal) => {
  dbLogger.debug("Ensuring seed missives", {
    tags: ["seed"],
  });
  const existing = await db.select<{ id: string | RecordId }>(TABLE);
  const existingIds = new Set<string>(
    (existing ?? []).map((record) =>
      typeof record.id === "string" ? record.id : record.id.toString(),
    ),
  );

  const { records, source } = await loadSeedMissives({ cwd: process.cwd() });
  if (records.length === 0) {
    dbLogger.warn("No seed missives available", {
      source,
      tags: ["seed"],
    });
    return;
  }

  const missing = records.filter((missive) => !existingIds.has(missive.id));

  if (missing.length === 0) {
    dbLogger.debug("No new missives to seed", {
      existingCount: existingIds.size,
      source,
      tags: ["seed"],
    });
    return;
  }

  dbLogger.info("Seeding missives", {
    count: missing.length,
    source,
    tags: ["seed"],
  });

  for (const missive of missing) {
    const { recordId, id, slug } = resolveSeedIdentifier(missive);
    const payload = {
      kind: missive.kind,
      slug: sanitizeSlug(missive.slug ?? slug),
      title: missive.title,
      summary: missive.summary,
      body: missive.body,
      docPath: missive.docPath,
      metadata: missive.metadata ?? {},
      updatedAt: missive.updatedAt ?? new Date().toISOString(),
    } as const;
    try {
      await db.upsert(recordId, payload);
    } catch (error) {
      dbLogger.error("Failed seeding missive", error, {
        id,
        kind: missive.kind,
        slug: payload.slug,
        docPath: missive.docPath,
        tags: ["seed", "missive"],
      });
      throw error;
    }
  }

  dbLogger.info("Seed missives inserted", {
    source,
    tags: ["seed"],
  });
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
