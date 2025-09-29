import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

import { createAppLogger } from "@root-solar/observability";
import type { Context } from "./context.ts";
import { getNetworkStatus } from "@root-solar/net/status";
import { normalizeOptionalSlug } from "@root-solar/globalization";
import {
  beingRegistrationStartInputSchema,
  beingRegistrationCompleteInputSchema,
  createBeingRegistrationHandlers,
  type BeingRegistrationProfile,
} from "@root-solar/auth/procedures";
import type { BeingRecord } from "./persistence/entities/being/entity.ts";

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

const listAxiomsInput = z
  .object({
    sentiment: z.string().min(1).optional(),
  })
  .optional();

const listTagsOutput = z.array(
  z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    tags: z.array(z.string().min(1)).optional(),
  }),
);

const createAxiomInput = z.object({
  title: z.string().min(5),
  details: z.string().min(5).optional(),
  tagSlugs: z.array(z.string().min(1)).optional(),
});

const addMissiveTagInput = z.object({
  missiveId: z.string().min(1),
  tagSlug: z.string().min(1),
});

const addTagTagInput = z.object({
  tagId: z.string().min(1),
  tagSlug: z.string().min(1),
});

const removeMissiveTagInput = addMissiveTagInput;

const stripTagPrefix = (value: string) =>
  value.slice(0, 4).toLowerCase() === "tag:" ? value.slice(4) : value;

const resolveTagSlug = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  return normalizeOptionalSlug(stripTagPrefix(trimmed));
};

const resolveTagId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes(":")) {
    return trimmed;
  }
  const normalized = normalizeOptionalSlug(trimmed);
  return normalized ? `tag:${normalized}` : null;
};

const getAxiomInput = z.object({
  axiomId: z.string().min(1),
  beingId: z.string().min(1).optional(),
});

const sentimentInput = z.object({
  beingId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectTable: z.string().min(1).optional(),
  tagId: z.string().min(1),
  weight: z.number().int().min(0),
  maxWeight: z.number().int().min(0).optional(),
});

const listSentimentsInput = z.object({
  beingId: z.string().min(1),
  tagId: z.string().min(1).optional(),
  subjectTable: z.string().min(1).optional(),
});

const removeSentimentInput = z.object({
  beingId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectTable: z.string().min(1).optional(),
  tagId: z.string().min(1),
});

const createCommentInput = z.object({
  axiomId: z.string().min(1),
  parentCommentId: z.string().min(1).optional(),
  authorBeingId: z.string().min(1),
  authorDisplayName: z.string().min(1),
  body: z.string().min(1),
});

export const router = t.router({
  listAxioms: procedure
    .input(listAxiomsInput)
    .query(({ ctx, input }) =>
      ctx.missives.list({ sentimentSlug: input?.sentiment }),
    ),
  listTags: procedure
    .output(listTagsOutput)
    .query(({ ctx }) => ctx.tags.list()),
  getAxiom: procedure
    .input(getAxiomInput)
    .query(async ({ input, ctx }) => {
      const missive = await ctx.missives.get(input.axiomId);
      if (!missive) {
        routerLogger.debug("Missive not found for detail", {
          id: input.axiomId,
          tags: ["query"],
        });
        return null;
      }
      const comments = await ctx.comments.listForAxiom(missive.id);
      const sentiments = input.beingId
        ? (await ctx.sentiments.listForBeing(input.beingId)).filter(
            (sentiment) =>
              sentiment.subjectTable === "missive" &&
              sentiment.subjectId === missive.id,
          )
        : [];
      return {
        ...missive,
        comments,
        sentiments,
      };
    }),
  createAxiom: procedure
    .input(createAxiomInput)
    .mutation(({ input, ctx }) => ctx.missives.create(input)),
  addMissiveTag: procedure
    .input(addMissiveTagInput)
    .mutation(async ({ input, ctx }) => {
      routerLogger.debug("addMissiveTag invoked", {
        missiveId: input.missiveId,
        tagSlug: input.tagSlug,
        tags: ["mutation", "tag"],
      });
      const normalizedSlug = resolveTagSlug(input.tagSlug);
      if (!normalizedSlug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provide a valid tag slug.",
        });
      }

      routerLogger.debug("Normalized tag slug for missive", {
        missiveId: input.missiveId,
        normalizedSlug,
        tags: ["mutation", "tag"],
      });

      const updatedMissive = await ctx.missives.addTag({
        missiveId: input.missiveId,
        tagSlug: normalizedSlug,
      });

      if (!updatedMissive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Missive not found.",
        });
      }

      routerLogger.debug("Missive updated with tag", {
        missiveId: updatedMissive.id,
        ensuredTagSlug: normalizedSlug,
        tagCount: updatedMissive.tags.length,
        tags: ["mutation", "tag"],
      });

      return updatedMissive;
    }),
  addTagTag: procedure
    .input(addTagTagInput)
    .mutation(async ({ input, ctx }) => {
      routerLogger.debug("addTagTag invoked", {
        tagId: input.tagId,
        tagSlug: input.tagSlug,
        tags: ["mutation", "tag"],
      });

      const normalizedTagId = resolveTagId(input.tagId);
      if (!normalizedTagId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provide a valid tag identifier.",
        });
      }

      const normalizedSlug = resolveTagSlug(input.tagSlug);
      if (!normalizedSlug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provide a valid tag slug.",
        });
      }

      routerLogger.debug("Resolved tag tagging payload", {
        targetTagId: normalizedTagId,
        parentTagSlug: normalizedSlug,
        tags: ["mutation", "tag"],
      });

      const updatedTag = await ctx.tags.addParent({
        tagId: normalizedTagId,
        parentTagSlug: normalizedSlug,
      });

      if (!updatedTag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found.",
        });
      }

      routerLogger.debug("Tag updated with parent", {
        tagId: updatedTag.id,
        parentCount: updatedTag.tags?.length ?? 0,
        tags: ["mutation", "tag"],
      });

      return updatedTag;
    }),
  removeMissiveTag: procedure
    .input(removeMissiveTagInput)
    .mutation(async ({ input, ctx }) => {
      routerLogger.debug("removeMissiveTag invoked", {
        missiveId: input.missiveId,
        tagSlug: input.tagSlug,
        tags: ["mutation", "tag"],
      });
      const normalizedSlug = resolveTagSlug(input.tagSlug);
      if (!normalizedSlug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provide a valid tag slug.",
        });
      }

      const updatedMissive = await ctx.missives.removeTag({
        missiveId: input.missiveId,
        tagSlug: normalizedSlug,
      });

      if (!updatedMissive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Missive not found.",
        });
      }

      routerLogger.debug("Missive updated after tag removal", {
        missiveId: updatedMissive.id,
        removedTagSlug: normalizedSlug,
        tagCount: updatedMissive.tags.length,
        tags: ["mutation", "tag"],
      });

      return updatedMissive;
    }),
  setSentiment: procedure
    .input(sentimentInput)
    .mutation(({ input, ctx }) =>
      ctx.sentiments.upsert({
        beingId: input.beingId,
        subjectId: input.subjectId,
        subjectTable: input.subjectTable ?? "missive",
        tagId: input.tagId,
        weight: input.weight,
        maxWeight: input.maxWeight,
      }),
    ),
  listSentimentsForBeing: procedure
    .input(listSentimentsInput)
    .query(({ input, ctx }) =>
      ctx.sentiments.listForBeing(input.beingId, {
        tagId: input.tagId,
        subjectTable: input.subjectTable ?? "missive",
      }),
    ),
  removeSentiment: procedure
    .input(removeSentimentInput)
    .mutation(({ input, ctx }) =>
      ctx.sentiments.remove({
        beingId: input.beingId,
        subjectId: input.subjectId,
        subjectTable: input.subjectTable ?? "missive",
        tagId: input.tagId,
      }),
    ),
  addAxiomComment: procedure
    .input(createCommentInput)
    .mutation(async ({ input, ctx }) => {
      const missive = await ctx.missives.get(input.axiomId);
      if (!missive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Missive ${input.axiomId} not found`,
        });
      }
      return await ctx.comments.create({
        axiomId: missive.id,
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
