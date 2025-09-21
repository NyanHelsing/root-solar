import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

import { createAppLogger } from "@root-solar/observability";
import {
  loadMissivesFromDocs,
  writeMissivesToDocs,
  type MissiveKind,
} from "@root-solar/planning";
import { type Context } from "./context.ts";
import { getNetworkStatus } from "@root-solar/net/status";
import {
  beingRegistrationStartInputSchema,
  beingRegistrationCompleteInputSchema,
  createBeingRegistrationHandlers,
  type BeingRegistrationProfile,
} from "@root-solar/auth/procedures";
import type { BeingRecord } from "./persistence/entities/being/entity.ts";

const MISSIVE_KIND_VALUES = [
  "vision",
  "initiative",
  "epic",
  "story",
  "axiom",
  "comment",
] as const satisfies readonly MissiveKind[];
const MISSIVE_KIND_SET = new Set<MissiveKind>(MISSIVE_KIND_VALUES);

const missiveKindSchema = z.enum(MISSIVE_KIND_VALUES);

export const t = initTRPC.context<Context>().create();

const routerLogger = createAppLogger("api:router", {
  tags: ["api", "trpc"],
});

const loggingMiddleware = t.middleware(async ({ path, type, input, next }) => {
  const start = Date.now();
  const hasInput = typeof input !== "undefined";
  routerLogger.debug("tRPC call started", {
    path,
    type,
    hasInput,
    tags: ["request", "trpc"],
  });
  try {
    const result = await next();
    const durationMs = Date.now() - start;
    if (result.ok) {
      routerLogger.info("tRPC call succeeded", {
        path,
        type,
        durationMs,
        tags: ["request", "trpc"],
      });
    } else {
      routerLogger.error("tRPC call failed", result.error, {
        path,
        type,
        durationMs,
        tags: ["request", "trpc"],
      });
    }
    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    routerLogger.error("tRPC call threw", error, {
      path,
      type,
      hasInput,
      durationMs,
      tags: ["request", "trpc"],
    });
    throw error;
  }
});

const procedure = t.procedure.use(loggingMiddleware);

const createBeingRegistrationResolver = (ctx: Context) =>
  createBeingRegistrationHandlers<BeingRecord & BeingRegistrationProfile>({
    store: ctx.authRegistrations,
    upsertBeing: async ({
      name,
      signingPublicKey,
      encryptionPublicKey,
      intentBase64,
      messageBase64,
    }) =>
      await ctx.beings.create({
        name,
        signingPublicKey,
        encryptionPublicKey,
        intentBase64,
        messageBase64,
      }),
  });

const createMissiveInput = z.object({
  kind: missiveKindSchema,
  title: z.string().min(3),
  summary: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  docPath: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const getMissiveInput = z
  .object({
    missiveId: z.string().min(1).optional(),
    axiomId: z.string().min(1).optional(),
    beingId: z.string().min(1).optional(),
  })
  .refine((value) => value.missiveId || value.axiomId, {
    message: "missiveId or axiomId is required",
  });

const listMissivesInput = z
  .object({
    kind: missiveKindSchema.optional(),
  })
  .optional();

const syncFromDocsInput = z
  .object({
    cwd: z.string().min(1).optional(),
  })
  .optional();

const syncToDocsInput = z
  .object({
    cwd: z.string().min(1).optional(),
    overwrite: z.boolean().optional(),
  })
  .optional();

const createAxiomInput = z.object({
  title: z.string().min(5),
  details: z.string().min(5).optional(),
});

const getAxiomInput = z
  .object({
    axiomId: z.string().min(1).optional(),
    missiveId: z.string().min(1).optional(),
    beingId: z.string().min(1).optional(),
  })
  .refine((value) => value.axiomId || value.missiveId, {
    message: "missiveId or axiomId is required",
  });

const sentimentInput = z
  .object({
    beingId: z.string().min(1),
    missiveId: z.string().min(1).optional(),
    axiomId: z.string().min(1).optional(),
    type: z.string().min(1),
    weight: z.number().int().min(0),
    maxWeight: z.number().int().min(0).optional(),
  })
  .refine((value) => value.missiveId || value.axiomId, {
    message: "missiveId or axiomId is required",
  });

const listSentimentsInput = z.object({
  beingId: z.string().min(1),
  type: z.string().min(1).optional(),
});

const removeSentimentInput = z
  .object({
    beingId: z.string().min(1),
    missiveId: z.string().min(1).optional(),
    axiomId: z.string().min(1).optional(),
    type: z.string().min(1),
  })
  .refine((value) => value.missiveId || value.axiomId, {
    message: "missiveId or axiomId is required",
  });

const createCommentInput = z.object({
  axiomId: z.string().min(1),
  parentCommentId: z.string().min(1).optional(),
  authorBeingId: z.string().min(1),
  authorDisplayName: z.string().min(1),
  body: z.string().min(1),
});

const ensureMissiveId = (id: string): string => {
  if (id.startsWith("missive:")) {
    const remainder = id.slice("missive:".length);
    const legacyParts = remainder.split(":");
    if (legacyParts.length >= 2) {
      const [kind, ...rest] = legacyParts;
      const slugPart = rest.join(":");
      const normalizedSlug = slugPart
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "")
        .trim();
      return `missive:${kind}_${normalizedSlug || slugPart}`;
    }
    return id;
  }
  const parts = id.split(":");
  if (parts.length >= 2) {
    const [maybeKind] = parts;
    if (maybeKind === "missive") {
      return id;
    }
    if (MISSIVE_KIND_SET.has(maybeKind as MissiveKind)) {
      return `missive:${id}`;
    }
  }
  if (id.startsWith("axiom:")) {
    return `missive:${id}`;
  }
  return id;
};

const toMissiveUpsertPayload = (missive: {
  id: string;
  kind: MissiveKind;
  slug: string;
  title: string;
  summary?: string;
  body?: string;
  docPath?: string;
  metadata?: Record<string, unknown>;
}) => ({
  ...missive,
});

export const router = t.router({
  listMissives: procedure
    .input(listMissivesInput)
    .query(({ ctx, input }) => ctx.missives.list({ kind: input?.kind })),
  getMissive: procedure
    .input(getMissiveInput)
    .query(async ({ input, ctx }) => {
      const targetMissiveId = input.missiveId ?? input.axiomId;
      if (!targetMissiveId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "missiveId is required" });
      }
      const missiveId = ensureMissiveId(targetMissiveId);
      const missive = await ctx.missives.get(missiveId);
      if (!missive) {
        routerLogger.debug("Missive not found for detail", {
          id: missiveId,
          tags: ["query"],
        });
        return null;
      }
      const comments = await ctx.comments.listForAxiom(missive.id);
      const sentiments = input.beingId
        ? (await ctx.sentiments.listForBeing(input.beingId)).filter(
            (sentiment) => ensureMissiveId(sentiment.missiveId ?? sentiment.axiomId) === missive.id,
          )
        : [];
      return {
        ...missive,
        comments,
        sentiments,
      };
    }),
  createMissive: procedure
    .input(createMissiveInput)
    .mutation(({ input, ctx }) =>
      ctx.missives.create({
        kind: input.kind,
        title: input.title,
        summary: input.summary,
        body: input.body,
        docPath: input.docPath,
        metadata: input.metadata,
      }),
    ),
  syncMissivesFromDocs: procedure
    .input(syncFromDocsInput)
    .mutation(async ({ ctx, input }) => {
      const missives = await loadMissivesFromDocs({ cwd: input?.cwd });
      const upserted = await Promise.all(
        missives.map((missive) =>
          ctx.missives.upsert(toMissiveUpsertPayload(missive)),
        ),
      );
      const count = upserted.filter(Boolean).length;
      return {
        count,
      };
    }),
  syncMissivesToDocs: procedure
    .input(syncToDocsInput)
    .mutation(async ({ ctx, input }) => {
      const missives = await ctx.missives.list();
      const documents = missives
        .filter((missive) => missive.docPath && missive.body)
        .map((missive) => ({
          id: missive.id,
          kind: missive.kind,
          slug: missive.slug,
          title: missive.title,
          summary: missive.summary,
          body: missive.body ?? "",
          docPath: missive.docPath!,
          metadata: missive.metadata ?? {},
        }));
      if (documents.length === 0) {
        return {
          count: 0,
        };
      }
      await writeMissivesToDocs(documents, {
        cwd: input?.cwd,
        overwrite: input?.overwrite ?? true,
      });
      return {
        count: documents.length,
      };
    }),
  listAxioms: procedure.query(({ ctx }) => ctx.missives.list({ kind: "axiom" })),
  getAxiom: procedure
    .input(getAxiomInput)
    .query(async ({ input, ctx }) => {
      const missiveId = ensureMissiveId(input.missiveId ?? input.axiomId);
      const axiom = await ctx.missives.get(missiveId);
      if (!axiom) {
        routerLogger.debug("Axiom not found for detail", {
          id: input.axiomId,
          tags: ["query"],
        });
        return null;
      }
      const comments = await ctx.comments.listForAxiom(axiom.id);
      const sentiments = input.beingId
        ? (await ctx.sentiments.listForBeing(input.beingId)).filter(
            (sentiment) => ensureMissiveId(sentiment.missiveId ?? sentiment.axiomId) === axiom.id,
          )
        : [];
      return {
        ...axiom,
        comments,
        sentiments,
      };
    }),
  createAxiom: procedure
    .input(createAxiomInput)
    .mutation(({ input, ctx }) =>
      ctx.missives.create({
        kind: "axiom",
        title: input.title,
        summary: input.details,
        body: input.details,
      }),
    ),
  setSentiment: procedure
    .input(sentimentInput)
    .mutation(({ input, ctx }) => {
      const targetMissiveId = input.missiveId ?? input.axiomId;
      if (!targetMissiveId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "missiveId is required" });
      }
      return ctx.sentiments.upsert({
        beingId: input.beingId,
        missiveId: ensureMissiveId(targetMissiveId),
        type: input.type,
        weight: input.weight,
        maxWeight: input.maxWeight,
      });
    }),
  listSentimentsForBeing: procedure
    .input(listSentimentsInput)
    .query(async ({ input, ctx }) => {
      const sentiments = await ctx.sentiments.listForBeing(input.beingId, {
        type: input.type,
      });
      if (!input.type) {
        return sentiments;
      }
      return sentiments.filter((sentiment) => sentiment.type === input.type);
    }),
  removeSentiment: procedure
    .input(removeSentimentInput)
    .mutation(({ input, ctx }) => {
      const targetMissiveId = input.missiveId ?? input.axiomId;
      if (!targetMissiveId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "missiveId is required" });
      }
      return ctx.sentiments.remove({
        beingId: input.beingId,
        missiveId: ensureMissiveId(targetMissiveId),
        type: input.type,
      });
    }),
  addAxiomComment: procedure
    .input(createCommentInput)
    .mutation(async ({ input, ctx }) => {
      const missiveId = ensureMissiveId(input.axiomId);
      const axiom = await ctx.missives.get(missiveId);
      if (!axiom) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Axiom ${input.axiomId} not found`,
        });
      }
      return await ctx.comments.create({
        axiomId: axiom.id,
        parentCommentId: input.parentCommentId,
        authorBeingId: input.authorBeingId,
        authorDisplayName: input.authorDisplayName,
        body: input.body,
      });
    }),
  startBeingRegistration: procedure
    .input(beingRegistrationStartInputSchema)
    .mutation(({ ctx, input }) =>
      createBeingRegistrationResolver(ctx).start(input),
    ),
  completeBeingRegistration: procedure
    .input(beingRegistrationCompleteInputSchema)
    .mutation(({ ctx, input }) =>
      createBeingRegistrationResolver(ctx).complete(input),
    ),
  networkStatus: procedure.query(() => getNetworkStatus()),
});

export type ApiRouter = typeof router;
