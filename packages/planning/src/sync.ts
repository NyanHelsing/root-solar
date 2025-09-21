import { createAppLogger } from "@root-solar/observability";

import {
  connectToSurreal,
  listMissives,
  upsertMissives,
} from "./surreal.ts";
import {
  loadMissivesFromDocs,
  writeMissivesToDocs,
} from "./docs.ts";
import type {
  LoadMissivesOptions,
  MissiveDocument,
  MissiveSyncSummary,
  SurrealConnectionOptions,
  WriteMissivesOptions,
} from "./types.ts";

const logger = createAppLogger("planning:sync", {
  tags: ["planning", "sync"],
});

export type SyncDocsToDbOptions = LoadMissivesOptions & {
  connection?: SurrealConnectionOptions;
};

export const syncDocsToDb = async (
  options: SyncDocsToDbOptions = {},
): Promise<MissiveSyncSummary> => {
  const missives = await loadMissivesFromDocs(options);
  if (missives.length === 0) {
    logger.warn("No missives discovered in documentation", {
      tags: ["sync", "docs-to-db"],
    });
  }
  const db = await connectToSurreal(options.connection);
  try {
    const summary = await upsertMissives(db, missives);
    return summary;
  } finally {
    await db.close();
    logger.debug("SurrealDB connection closed after docs-to-db sync", {
      tags: ["sync", "docs-to-db"],
    });
  }
};

export type SyncDbToDocsOptions = WriteMissivesOptions & {
  connection?: SurrealConnectionOptions;
};

export const syncDbToDocs = async (
  options: SyncDbToDocsOptions = {},
): Promise<MissiveSyncSummary> => {
  const db = await connectToSurreal(options.connection);
  try {
    const records = await listMissives(db);
    const eligible: MissiveDocument[] = records
      .filter((record) => record.docPath && record.body)
      .map((record) => ({
        id: record.id,
        kind: record.kind,
        slug: record.slug,
        docPath: record.docPath!,
        title: record.title,
        summary: record.summary,
        body: record.body ?? "",
        metadata: record.metadata ?? {},
      }));
    if (eligible.length === 0) {
      logger.warn("No missives with document metadata found in database", {
        tags: ["sync", "db-to-docs"],
      });
      return {
        upserted: 0,
        skipped: records.length,
      };
    }
    await writeMissivesToDocs(eligible, {
      cwd: options.cwd,
      overwrite: options.overwrite ?? true,
    });
    logger.info("Missives written to documentation", {
      count: eligible.length,
      tags: ["sync", "db-to-docs"],
    });
    return {
      upserted: eligible.length,
      skipped: records.length - eligible.length,
    };
  } finally {
    await db.close();
    logger.debug("SurrealDB connection closed after db-to-docs sync", {
      tags: ["sync", "db-to-docs"],
    });
  }
};
