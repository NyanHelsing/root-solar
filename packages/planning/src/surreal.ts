import { surrealdbNodeEngines } from "@surrealdb/node";
import { nanoid } from "nanoid";
import { RecordId, Surreal } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";

import type {
  MissiveDocument,
  MissiveRecord,
  MissiveSyncSummary,
  SurrealConnectionOptions,
} from "./types.ts";

const logger = createAppLogger("planning:surreal", {
  tags: ["planning", "surreal"],
});

const DEFAULT_DB_URL = "surrealkv://root-solar";
const DEFAULT_NAMESPACE = "root-solar";
const DEFAULT_DATABASE = "root-solar";
const MISSIVE_TABLE = "missive" as const;

type RawMissiveRecord = Omit<MissiveRecord, "id"> & {
  id: string | RecordId;
};

const normalizeMissiveRecord = (record: RawMissiveRecord): MissiveRecord => ({
  ...record,
  id: typeof record.id === "string" ? record.id : record.id.toString(),
});

const sanitizeSlug = (value: string | undefined) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const resolveRecordId = (
  missive: MissiveDocument,
): { recordId: RecordId; id: string; slug: string } => {
  const parseExisting = () => {
    if (!missive.id || !missive.id.startsWith("missive:")) {
      return null;
    }
    const remainder = missive.id.slice("missive:".length);
    if (!remainder) {
      return null;
    }
    const legacyParts = remainder.split(":");
    if (legacyParts.length >= 2) {
      const [kind, ...rest] = legacyParts;
      const slugSource = rest.length > 0 ? rest.join(":") : missive.slug ?? missive.title ?? remainder;
      const resolvedSlug = sanitizeSlug(slugSource) || nanoid().toLowerCase();
      const identifier = `${kind}_${resolvedSlug}`;
      return {
        recordId: new RecordId(MISSIVE_TABLE, identifier),
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
    const resolvedSlug = sanitizeSlug(slugPart) || nanoid().toLowerCase();
    const identifier = `${kind}_${resolvedSlug}`;
    return {
      recordId: new RecordId(MISSIVE_TABLE, identifier),
      id: `missive:${identifier}`,
      slug: resolvedSlug,
    } as const;
  };

  const existing = parseExisting();
  if (existing) {
    return existing;
  }

  const slug = sanitizeSlug(missive.slug ?? missive.title ?? "") || nanoid().toLowerCase();
  const identifier = `${missive.kind}_${slug}`;
  return {
    recordId: new RecordId(MISSIVE_TABLE, identifier),
    id: `missive:${identifier}`,
    slug,
  };
};

export const connectToSurreal = async (
  options: SurrealConnectionOptions = {},
): Promise<Surreal> => {
  const url = options.url ?? process.env.SURREAL_DB_URL ?? DEFAULT_DB_URL;
  const namespace = options.namespace ?? process.env.SURREAL_NAMESPACE ?? DEFAULT_NAMESPACE;
  const database = options.database ?? process.env.SURREAL_DATABASE ?? DEFAULT_DATABASE;

  logger.info("Connecting to SurrealDB", {
    url,
    namespace,
    database,
    tags: ["startup"],
  });

  const db = new Surreal({
    engines: surrealdbNodeEngines(),
  });
  await db.connect(url);
  await db.use({ namespace, database });

  logger.debug("Connected to SurrealDB", {
    tags: ["startup"],
  });

  return db;
};

export const upsertMissives = async (
  db: Surreal,
  missives: MissiveDocument[],
): Promise<MissiveSyncSummary> => {
  let upserted = 0;
  await Promise.all(
    missives.map(async (missive) => {
      const { recordId, id, slug } = resolveRecordId(missive);
      logger.debug("Upserting missive", {
        id,
        kind: missive.kind,
        slug,
        tags: ["mutation", "missive"],
      });
      await db.upsert(recordId, {
        kind: missive.kind,
        slug,
        title: missive.title,
        summary: missive.summary,
        body: missive.body,
        docPath: missive.docPath,
        metadata: missive.metadata,
        updatedAt: new Date().toISOString(),
      });
      upserted += 1;
    }),
  );
  logger.info("Missives upserted", {
    count: upserted,
    tags: ["mutation", "missive"],
  });
  return {
    upserted,
    skipped: 0,
  } satisfies MissiveSyncSummary;
};

export const listMissives = async (db: Surreal): Promise<MissiveRecord[]> => {
  const records = await db.select<RawMissiveRecord[]>(MISSIVE_TABLE);
  if (!records) {
    return [];
  }
  return records.map(normalizeMissiveRecord).sort((a, b) => a.id.localeCompare(b.id));
};

const resolveRecordIdFromString = (identifier: string): RecordId => {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return new RecordId(MISSIVE_TABLE, nanoid().toLowerCase());
  }
  if (!trimmed.startsWith("missive:")) {
    return new RecordId(MISSIVE_TABLE, sanitizeSlug(trimmed) || nanoid().toLowerCase());
  }
  const remainder = trimmed.slice("missive:".length);
  if (!remainder) {
    return new RecordId(MISSIVE_TABLE, nanoid().toLowerCase());
  }
  const legacyParts = remainder.split(":");
  if (legacyParts.length >= 2) {
    const [kind, ...rest] = legacyParts;
    const slug = sanitizeSlug(rest.join(":")) || nanoid().toLowerCase();
    return new RecordId(MISSIVE_TABLE, `${kind}_${slug}`);
  }
  return new RecordId(MISSIVE_TABLE, remainder);
};

export const getMissiveById = async (
  db: Surreal,
  id: string,
): Promise<MissiveRecord | null> => {
  const recordId = resolveRecordIdFromString(id);
  const record = await db.select<RawMissiveRecord | RawMissiveRecord[] | null>(recordId);
  if (!record) {
    return null;
  }
  const normalized = Array.isArray(record)
    ? record[0]
    : (record as RawMissiveRecord | null);
  if (!normalized) {
    return null;
  }
  return normalizeMissiveRecord(normalized);
};
