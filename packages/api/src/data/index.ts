import { createAppLogger } from "@root-solar/observability";
import {
  loadMissivesFromDocs,
  type MissiveDocument,
  type MissiveRecord,
} from "@root-solar/planning";

const dataLogger = createAppLogger("data:missives", {
  tags: ["data", "missive"],
});

const staticAxiomSeeds: MissiveRecord[] = [
  {
    id: "missive:axiom_0001",
    kind: "axiom",
    slug: "axiom-0001",
    title: "Everyone matters the same",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0002",
    kind: "axiom",
    slug: "axiom-0002",
    title: "Rights protect needs.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0003",
    kind: "axiom",
    slug: "axiom-0003",
    title: "Don't get in the way; fix what you break.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0004",
    kind: "axiom",
    slug: "axiom-0004",
    title: "Use only what’s needed to meet the need.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0005",
    kind: "axiom",
    slug: "axiom-0005",
    title: "Make rules that can all fit together.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0006",
    kind: "axiom",
    slug: "axiom-0006",
    title: "When we can choose, bother people the least.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0007",
    kind: "axiom",
    slug: "axiom-0007",
    title:
      "First things first: needs that keep others possible come first (only for as long as needed).",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0008",
    kind: "axiom",
    slug: "axiom-0008",
    title:
      "If there isn’t enough, share fairly and change the plan when things change.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0009",
    kind: "axiom",
    slug: "axiom-0009",
    title: "If you caused the problem, help fix it.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0010",
    kind: "axiom",
    slug: "axiom-0010",
    title: "You can choose for yourself, not for others.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0011",
    kind: "axiom",
    slug: "axiom-0011",
    title:
      "What’s right depends on the situation; update when the situation changes.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0012",
    kind: "axiom",
    slug: "axiom-0012",
    title: "No one gets a “need” that erases other people.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0013",
    kind: "axiom",
    slug: "axiom-0013",
    title: "When it’s fuzzy, remember: rights protect needs; use examples.",
    summary: undefined,
    metadata: {},
  },
  {
    id: "missive:axiom_0014",
    kind: "axiom",
    slug: "axiom-0014",
    title: "If you claim a right, say what you need, clearly.",
    summary: undefined,
    metadata: {},
  },
];

const documentToRecord = (missive: MissiveDocument): MissiveRecord => ({
  id: missive.id,
  kind: missive.kind,
  slug: missive.slug,
  title: missive.title,
  summary: missive.summary,
  body: missive.body,
  docPath: missive.docPath,
  metadata: missive.metadata,
});

export const loadSeedMissives = async (options?: {
  cwd?: string;
}): Promise<{ records: MissiveRecord[]; source: "docs" | "static" }> => {
  try {
    const missives = await loadMissivesFromDocs(options);
    if (missives.length > 0) {
      const merged = new Map<string, MissiveRecord>();
      missives.forEach((missive) => {
        const record = documentToRecord(missive);
        merged.set(record.id, record);
      });
      staticAxiomSeeds.forEach((seed) => {
        if (!merged.has(seed.id)) {
          merged.set(seed.id, seed);
        }
      });
      const records = Array.from(merged.values());
      dataLogger.info("Loaded missive seeds from documentation", {
        count: records.length,
        tags: ["seed"],
      });
      return {
        records,
        source: "docs" as const,
      };
    }
    dataLogger.warn("No missives discovered in documentation during seed load", {
      tags: ["seed"],
    });
  } catch (error) {
    dataLogger.error("Failed to load missives from documentation; falling back to static seeds", error, {
      tags: ["seed"],
    });
  }
  return {
    records: staticAxiomSeeds,
    source: "static" as const,
  };
};
