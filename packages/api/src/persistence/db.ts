import { surrealdbNodeEngines } from "@surrealdb/node";
// biome-ignore lint/style/useImportType: Surreal exports runtime constructors used below
import { RecordId, StringRecordId, Surreal } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import { seedMissives, seedTags } from "../data/index.ts";

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
const TAG_TABLE = "tag" as const;

let dbPromise: Promise<Surreal> | null = null;

const normaliseTagId = (slugOrId: string) =>
  slugOrId.includes(":") ? slugOrId : `${TAG_TABLE}:${slugOrId}`;

const ensureTagSeeds = async (db: Surreal) => {
  dbLogger.debug("Ensuring seed tags", {
    count: seedTags.length,
    tags: ["seed"],
  });
  await Promise.all(
    seedTags.map(async ({ slug, label, description, tags }) => {
      const id = normaliseTagId(slug);
      await db.upsert(new StringRecordId(id), {
        slug,
        label,
        description,
        tags,
      });
    }),
  );
  dbLogger.debug("Seed tags ensured", {
    tags: ["seed"],
  });
};

const ensureMissiveTags = async (db: Surreal) => {
  const missives = await db.select<{
    id: string | RecordId;
    tags?: string[];
    kind?: string;
  }>(MISSIVE_TABLE);
  if (!missives) {
    return;
  }
  const axiomaticTagId = normaliseTagId("axiomatic");
  const legacyAxiomTagId = normaliseTagId("axiom");

  await Promise.all(
    missives.map(async ({ id, tags, kind }) => {
      const normalizedId = typeof id === "string" ? id : id.toString();
      const current = Array.isArray(tags)
        ? tags.map((tag) => (typeof tag === "string" ? tag : String(tag)))
        : [];
      const unique = new Set(current);
      let changed = false;

      if (
        !unique.has(axiomaticTagId) &&
        (unique.has(legacyAxiomTagId) || kind === "axiom" || kind === "axiomatic" || current.length === 0)
      ) {
        unique.add(axiomaticTagId);
        changed = true;
      }

      if (kind === "axiom" && !unique.has(legacyAxiomTagId)) {
        unique.add(legacyAxiomTagId);
        changed = true;
      }

      if (!changed) {
        return;
      }

      const nextTags = Array.from(unique);
      if (nextTags.includes(axiomaticTagId)) {
        const ordered = [axiomaticTagId, ...nextTags.filter((value) => value !== axiomaticTagId)];
        nextTags.splice(0, nextTags.length, ...ordered);
      }

      await db.query(
        "UPDATE type::thing($table, $id) MERGE { tags: $tags }",
        {
          table: MISSIVE_TABLE,
          id: normalizedId,
          tags: nextTags,
        },
      );
    }),
  );
};

const ensureSeeds = async (db: Surreal) => {
  await ensureTagSeeds(db);

  dbLogger.debug("Ensuring seed missives", {
    tags: ["seed"],
  });

  const migrateLegacyAxioms = async () => {
    const legacyAxioms = await db.select<{
      id: string | RecordId;
      title: string;
      kind?: string;
    }>(LEGACY_AXIOM_TABLE);
    if (!legacyAxioms || legacyAxioms.length === 0) {
      return false;
    }
    dbLogger.info("Migrating legacy axioms into missive table", {
      count: legacyAxioms.length,
      tags: ["seed", "migration"],
    });
    await Promise.all(
      legacyAxioms.map(async ({ id, kind, ...record }) => {
        const normalizedId = typeof id === "string" ? id : id.toString();
        const missiveId = normalizedId.startsWith("missive:")
          ? normalizedId
          : normalizedId.replace(/^axiom:/, "missive:");
        const primarySlug = kind === "axiom" || kind === "axiomatic" ? kind : "axiomatic";
        const tagIds = new Set<string>();
        tagIds.add(normaliseTagId("axiomatic"));
        if (primarySlug === "axiom") {
          tagIds.add(normaliseTagId("axiom"));
        }
        await db.upsert(new StringRecordId(missiveId), {
          ...record,
          tags: Array.from(tagIds),
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
      seedMissives.map(async ({ id, tagSlugs, ...missive }) => {
        const tagSet = new Set((tagSlugs ?? []).map(normaliseTagId));
        if (tagSet.has(normaliseTagId("axiomatic"))) {
          tagSet.add(normaliseTagId("axiom"));
        }
        const tags = Array.from(tagSet);
        await db.upsert(new StringRecordId(id), {
          ...missive,
          tags,
        });
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
    await ensureMissiveTags(db);
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
