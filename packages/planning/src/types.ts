export type MissiveKind =
  | "vision"
  | "initiative"
  | "epic"
  | "story"
  | "axiom"
  | "comment";

export type MissiveDocument = {
  id: string;
  kind: MissiveKind;
  slug: string;
  docPath: string;
  title: string;
  summary?: string;
  body: string;
  metadata: Record<string, unknown>;
};

export type MissiveRecord = {
  id: string;
  kind: MissiveKind;
  slug: string;
  title: string;
  summary?: string;
  body?: string;
  docPath?: string;
  metadata?: Record<string, unknown>;
  updatedAt?: string;
};

export type MissiveSyncSummary = {
  upserted: number;
  skipped: number;
};

export type MissiveSyncMode = "docs-to-db" | "db-to-docs";

export type LoadMissivesOptions = {
  cwd?: string;
};

export type WriteMissivesOptions = {
  cwd?: string;
  overwrite?: boolean;
};

export type SurrealConnectionOptions = {
  url?: string;
  namespace?: string;
  database?: string;
};
