import process from "node:process";

import { createAppLogger } from "@root-solar/observability";

import { syncDbToDocs, syncDocsToDb } from "./sync.ts";
import type {
  MissiveSyncMode,
  SurrealConnectionOptions,
} from "./types.ts";

const logger = createAppLogger("planning:cli", {
  tags: ["planning", "cli"],
});

type ParsedArgs = {
  mode: MissiveSyncMode | null;
  cwd?: string;
  overwrite?: boolean;
  connection: SurrealConnectionOptions;
};

const parseArgs = (argv: string[]): ParsedArgs => {
  const [, , command, ...rest] = argv;
  const connection: SurrealConnectionOptions = {};
  let cwd: string | undefined;
  let overwrite: boolean | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg.startsWith("--cwd=")) {
      cwd = arg.slice("--cwd=".length);
      continue;
    }
    if (arg === "--cwd") {
      cwd = rest[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--no-overwrite") {
      overwrite = false;
      continue;
    }
    if (arg === "--overwrite") {
      overwrite = true;
      continue;
    }
    if (arg.startsWith("--url=")) {
      connection.url = arg.slice("--url=".length);
      continue;
    }
    if (arg === "--url") {
      connection.url = rest[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--namespace=")) {
      connection.namespace = arg.slice("--namespace=".length);
      continue;
    }
    if (arg === "--namespace") {
      connection.namespace = rest[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--database=")) {
      connection.database = arg.slice("--database=".length);
      continue;
    }
    if (arg === "--database") {
      connection.database = rest[index + 1];
      index += 1;
      continue;
    }
  }

  let mode: MissiveSyncMode | null = null;
  if (command === "docs-to-db") {
    mode = "docs-to-db";
  } else if (command === "db-to-docs") {
    mode = "db-to-docs";
  }

  return {
    mode,
    cwd,
    overwrite,
    connection,
  } satisfies ParsedArgs;
};

const printUsage = () => {
  const usage = `Usage: node --experimental-strip-types packages/planning/src/cli.ts <command> [options]\n\nCommands:\n  docs-to-db           Sync missives from documentation into SurrealDB\n  db-to-docs           Sync missives from SurrealDB back into documentation\n\nOptions:\n  --cwd <path>         Working directory containing documentation (defaults to process.cwd())\n  --url <url>          Override SurrealDB URL\n  --namespace <ns>     Override SurrealDB namespace\n  --database <db>      Override SurrealDB database\n  --overwrite          Force overwriting documentation files when pulling from DB\n  --no-overwrite       Prevent overwriting documentation files when pulling from DB\n`;
  process.stderr.write(usage);
};

const main = async () => {
  const parsed = parseArgs(process.argv);
  if (!parsed.mode) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (parsed.mode === "docs-to-db") {
    const summary = await syncDocsToDb({
      cwd: parsed.cwd,
      connection: parsed.connection,
    });
    logger.info("Docs-to-DB sync complete", {
      upserted: summary.upserted,
      skipped: summary.skipped,
      tags: ["sync", "docs-to-db"],
    });
    return;
  }

  const summary = await syncDbToDocs({
    cwd: parsed.cwd,
    overwrite: parsed.overwrite,
    connection: parsed.connection,
  });
  logger.info("DB-to-docs sync complete", {
    upserted: summary.upserted,
    skipped: summary.skipped,
    tags: ["sync", "db-to-docs"],
  });
};

await main().catch((error) => {
  logger.error("Planning CLI failed", error, {
    tags: ["sync", "cli"],
  });
  process.exitCode = 1;
});
