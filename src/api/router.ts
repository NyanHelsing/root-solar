import { initTRPC } from "@trpc/server";
import { z } from "zod";

import { type Context } from "./context.ts";
import { getNetworkStatus } from "../net/status.ts";

export const t = initTRPC.context<Context>().create();

const createAxiomInput = z.object({
  title: z.string().min(5),
  details: z.string().min(5).optional(),
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

export const router = t.router({
  listAxioms: t.procedure.query(({ ctx }) => ctx.axioms.list()),
  createAxiom: t.procedure
    .input(createAxiomInput)
    .mutation(({ input, ctx }) => ctx.axioms.create(input)),
  setSentiment: t.procedure
    .input(sentimentInput)
    .mutation(({ input, ctx }) => ctx.sentiments.upsert(input)),
  listSentimentsForBeing: t.procedure
    .input(listSentimentsInput)
    .query(({ input, ctx }) =>
      ctx.sentiments.listForBeing(input.beingId, { type: input.type }),
    ),
  removeSentiment: t.procedure
    .input(removeSentimentInput)
    .mutation(({ input, ctx }) => ctx.sentiments.remove(input)),
  networkStatus: t.procedure.query(() => getNetworkStatus()),
});

export type ApiRouter = typeof router;
