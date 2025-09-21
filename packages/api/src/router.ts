import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

import { createAppLogger } from "@root-solar/observability";
import { type Context } from "./context.ts";
import { getNetworkStatus } from "@root-solar/net/status";
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

const createAxiomInput = z.object({
  title: z.string().min(5),
  details: z.string().min(5).optional(),
});

const getAxiomInput = z.object({
  axiomId: z.string().min(1),
  beingId: z.string().min(1).optional(),
});

const sentimentInput = z.object({
  beingId: z.string().min(1),
  axiomId: z.string().min(1),
  type: z.string().min(1),
  weight: z.number().int().min(0),
  maxWeight: z.number().int().min(0).optional(),
});

const listSentimentsInput = z.object({
  beingId: z.string().min(1),
  type: z.string().min(1).optional(),
});

const removeSentimentInput = z.object({
  beingId: z.string().min(1),
  axiomId: z.string().min(1),
  type: z.string().min(1),
});

const createCommentInput = z.object({
  axiomId: z.string().min(1),
  parentCommentId: z.string().min(1).optional(),
  authorBeingId: z.string().min(1),
  authorDisplayName: z.string().min(1),
  body: z.string().min(1),
});

export const router = t.router({
  listAxioms: procedure.query(({ ctx }) => ctx.axioms.list()),
  getAxiom: procedure
    .input(getAxiomInput)
    .query(async ({ input, ctx }) => {
      const axiom = await ctx.axioms.get(input.axiomId);
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
            (sentiment) => sentiment.axiomId === axiom.id,
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
    .mutation(({ input, ctx }) => ctx.axioms.create(input)),
  setSentiment: procedure
    .input(sentimentInput)
    .mutation(({ input, ctx }) => ctx.sentiments.upsert(input)),
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
    .mutation(({ input, ctx }) => ctx.sentiments.remove(input)),
  addAxiomComment: procedure
    .input(createCommentInput)
    .mutation(async ({ input, ctx }) => {
      const axiom = await ctx.axioms.get(input.axiomId);
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
