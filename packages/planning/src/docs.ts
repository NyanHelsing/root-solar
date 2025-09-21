import { promises as fs } from "fs";
import path from "path";
import yaml from "yaml";

import type {
  LoadMissivesOptions,
  MissiveDocument,
  MissiveKind,
  WriteMissivesOptions,
} from "./types.ts";

const MISSIVE_SOURCE_DIRECTORIES: Record<MissiveKind, string[] | undefined> = {
  vision: ["docs/visions"],
  initiative: ["docs/initiatives"],
  epic: ["docs/roadmap/epics"],
  story: ["docs/roadmap/stories"],
  axiom: undefined,
  comment: undefined,
};

const SUPPORTED_DOC_KINDS: MissiveKind[] = ["vision", "initiative", "epic", "story"];

const createMissiveId = (kind: MissiveKind, slug: string) =>
  `missive:${kind}_${slug}`;

const isMarkdownFile = (filePath: string) => filePath.endsWith(".md");

const readDirectoryRecursive = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  });
  const files: string[] = [];
  await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await readDirectoryRecursive(resolved)));
        return;
      }
      if (entry.isFile() && isMarkdownFile(resolved)) {
        files.push(resolved);
      }
    }),
  );
  return files;
};

type FrontMatterParseResult = {
  metadata: Record<string, unknown>;
  body: string;
};

const parseFrontMatter = (content: string): FrontMatterParseResult => {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return {
      metadata: {},
      body: content,
    } satisfies FrontMatterParseResult;
  }

  let closingIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === "---") {
      closingIndex = index;
      break;
    }
  }

  if (closingIndex === -1) {
    return {
      metadata: {},
      body: content,
    } satisfies FrontMatterParseResult;
  }

  const frontMatterLines = lines.slice(1, closingIndex);
  const remainingLines = lines.slice(closingIndex + 1);
  const raw = frontMatterLines.join("\n");
  const metadata = raw.trim().length === 0 ? {} : (yaml.parse(raw) ?? {});
  return {
    metadata,
    body: remainingLines.join("\n").replace(/^\s+/, ""),
  } satisfies FrontMatterParseResult;
};

type TitleSummaryResult = {
  title: string;
  summary?: string;
};

const TITLE_PREFIX_PATTERN = /^(story|epic|vision|initiative)\s*:\s*/i;

const extractTitleAndSummary = (body: string): TitleSummaryResult => {
  const headingMatch = body.match(/^#\s+([^\n]+)$/m);
  if (!headingMatch) {
    return {
      title: "Untitled Missive",
      summary: undefined,
    } satisfies TitleSummaryResult;
  }

  const rawTitle = headingMatch[1].trim();
  const normalizedTitle = rawTitle.replace(TITLE_PREFIX_PATTERN, "").trim() || rawTitle;

  const lines = body.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('#')) {
      return false;
    }
    const normalized = trimmed.replace(/^#+\s*/, '').trim();
    return normalized === rawTitle;
  });
  if (headingIndex === -1) {
    return {
      title: normalizedTitle,
      summary: undefined,
    } satisfies TitleSummaryResult;
  }

  const summaryLines: string[] = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().length === 0) {
      if (summaryLines.length === 0) {
        continue;
      }
      break;
    }
    summaryLines.push(line.trim());
  }

  return {
    title: normalizedTitle,
    summary: summaryLines.length > 0 ? summaryLines.join(" ") : undefined,
  } satisfies TitleSummaryResult;
};

export const loadMissivesFromDocs = async (
  options: LoadMissivesOptions = {},
): Promise<MissiveDocument[]> => {
  const cwd = options.cwd ?? process.cwd();
  const results: MissiveDocument[] = [];

  await Promise.all(
    SUPPORTED_DOC_KINDS.map(async (kind) => {
      const directories = MISSIVE_SOURCE_DIRECTORIES[kind];
      if (!directories) {
        return;
      }
      await Promise.all(
        directories.map(async (relativeDir) => {
          const absoluteDir = path.resolve(cwd, relativeDir);
          const files = await readDirectoryRecursive(absoluteDir);
          await Promise.all(
            files.map(async (absolutePath) => {
              const raw = await fs.readFile(absolutePath, "utf8");
              const { metadata, body } = parseFrontMatter(raw);
              const { title, summary } = extractTitleAndSummary(body);
              const slug = path.basename(absolutePath, path.extname(absolutePath));
              const id = createMissiveId(kind, slug);
              results.push({
                id,
                kind,
                slug,
                docPath: path.relative(cwd, absolutePath),
                title,
                summary,
                body,
                metadata,
              });
            }),
          );
        }),
      );
    }),
  );

  return results.sort((a, b) => a.id.localeCompare(b.id));
};

const stringifyFrontMatter = (metadata: Record<string, unknown>) => {
  const keys = Object.keys(metadata);
  if (keys.length === 0) {
    return "";
  }
  const serialized = yaml.stringify(metadata, {
    indent: 2,
    lineWidth: 120,
  });
  return `---\n${serialized.trimEnd()}\n---\n\n`;
};

export const writeMissivesToDocs = async (
  missives: MissiveDocument[],
  options: WriteMissivesOptions = {},
) => {
  const cwd = options.cwd ?? process.cwd();
  await Promise.all(
    missives.map(async (missive) => {
      const absolutePath = path.resolve(cwd, missive.docPath);
      const directory = path.dirname(absolutePath);
      await fs.mkdir(directory, { recursive: true });
      const frontMatter = stringifyFrontMatter(missive.metadata);
      const body = missive.body.endsWith("\n") ? missive.body : `${missive.body}\n`;
      const content = `${frontMatter}${body}`;
      if (!options.overwrite) {
        const existing = await fs.readFile(absolutePath, "utf8").catch(() => null);
        if (existing && existing === content) {
          return;
        }
      }
      await fs.writeFile(absolutePath, content, "utf8");
    }),
  );
};
