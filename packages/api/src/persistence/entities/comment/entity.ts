import { nanoid } from "nanoid";
import { RecordId, StringRecordId } from "surrealdb";

import { createAppLogger } from "@root-solar/observability";
import type { Context } from "../../../context.ts";

const commentLogger = createAppLogger("persistence:comment", {
  tags: ["persistence", "comment"],
});

const TABLE = "comment" as const;

type RawCommentRecord = {
  id: string | RecordId;
  axiomId: string | RecordId;
  parentCommentId?: string | RecordId | null;
  authorBeingId: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
  replies?: (string | RecordId)[] | null;
};

export type CommentRecord = {
  id: string;
  axiomId: string;
  parentCommentId?: string | null;
  authorBeingId: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
};

export type CommentTreeNode = CommentRecord & {
  replies: CommentTreeNode[];
};

const toId = (value: string | RecordId): string =>
  typeof value === "string" ? value : value.toString();

const toCommentRecord = (record: RawCommentRecord): CommentRecord => ({
  id: toId(record.id),
  axiomId: toId(record.axiomId),
  parentCommentId:
    record.parentCommentId !== undefined && record.parentCommentId !== null
      ? toId(record.parentCommentId)
      : null,
  authorBeingId: record.authorBeingId,
  authorDisplayName: record.authorDisplayName,
  body: record.body,
  createdAt: record.createdAt,
});

const unwrapSingle = <T>(value: T | T[] | null): T | null => {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
};

const buildTree = (records: CommentRecord[]): CommentTreeNode[] => {
  const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const byId = new Map<string, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];

  for (const record of sorted) {
    byId.set(record.id, { ...record, replies: [] });
  }

  for (const record of sorted) {
    const node = byId.get(record.id);
    if (!node) {
      continue;
    }
    if (record.parentCommentId) {
      const parent = byId.get(record.parentCommentId);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  const sortReplies = (list: CommentTreeNode[]) => {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const child of list) {
      if (child.replies.length > 0) {
        sortReplies(child.replies);
      }
    }
  };

  sortReplies(roots);
  return roots;
};

export type CommentModel = ReturnType<typeof createCommentModel>;

let commentTablePrepared = false;

const ensureCommentTable = async (ctx: Context) => {
  if (commentTablePrepared) {
    return;
  }
  commentLogger.debug("Ensuring comment table exists", {
    tags: ["setup"],
  });
  await ctx.db.query("DEFINE TABLE IF NOT EXISTS comment SCHEMALESS");
  commentTablePrepared = true;
  commentLogger.debug("Comment table ready", {
    tags: ["setup"],
  });
};

export const createCommentModel = (ctx: Context) => {
  return {
    async listForAxiom(axiomId: string) {
      await ensureCommentTable(ctx);
      commentLogger.debug("Listing comments for axiom", {
        axiomId,
        tags: ["query"],
      });
      const records = await ctx.db.select<RawCommentRecord[] | RawCommentRecord | null>(TABLE);
      const collection = Array.isArray(records) ? records : records ? [records] : [];
      const normalized = collection
        .filter((record) => toId(record.axiomId) === toId(axiomId))
        .map(toCommentRecord);
      const tree = buildTree(normalized);
      commentLogger.debug("Comments listed", {
        axiomId,
        count: normalized.length,
        tags: ["query"],
      });
      return tree;
    },
    async create({
      axiomId,
      parentCommentId,
      authorBeingId,
      authorDisplayName,
      body,
    }: {
      axiomId: string;
      parentCommentId?: string;
      authorBeingId: string;
      authorDisplayName: string;
      body: string;
    }) {
      const id = nanoid();
      const createdAt = new Date().toISOString();
      const commentRef = new RecordId(TABLE, id);
      const axiomThing = axiomId.includes(":")
        ? new StringRecordId(axiomId)
        : new RecordId("axiom", axiomId);
      const normalizedAxiomId = axiomThing.toString();
      const parentThing = parentCommentId
        ? parentCommentId.includes(":")
          ? new StringRecordId(parentCommentId)
          : new RecordId(TABLE, parentCommentId)
        : null;
      const payload = {
        id,
        axiomId: normalizedAxiomId,
        parentCommentId: parentCommentId ? parentThing?.toString() ?? parentCommentId : null,
        authorBeingId,
        authorDisplayName,
        body,
        createdAt,
      } satisfies CommentRecord;

      commentLogger.debug("Creating comment", {
        id,
        axiomId,
        parentCommentId,
        tags: ["mutation", "create"],
      });

      await ensureCommentTable(ctx);
      const record = await ctx.db.create<CommentRecord>(commentRef, payload);
      const stored = unwrapSingle(record);
      const normalized = stored ? toCommentRecord(stored as unknown as RawCommentRecord) : payload;

      commentLogger.info("Comment created", {
        id,
        axiomId,
        parentCommentId,
        tags: ["mutation", "create"],
      });

      return {
        ...normalized,
        replies: [],
      } satisfies CommentTreeNode;
    },
  } satisfies {
    listForAxiom: (axiomId: string) => Promise<CommentTreeNode[]>;
    create: (input: {
      axiomId: string;
      parentCommentId?: string;
      authorBeingId: string;
      authorDisplayName: string;
      body: string;
    }) => Promise<CommentTreeNode>;
  };
};
