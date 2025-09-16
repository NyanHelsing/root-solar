import { initTRPC } from "@trpc/server";
import { z } from "zod";

import { type Context } from "./context.ts";

export const t = initTRPC.context<Context>().create();

const createAxiomInput = z.object({
  id: z.number(),
  title: z.string().min(5),
  details: z.string().min(5).optional(),
});

export const router = t.router({
  listAxioms: t.procedure.query(({ ctx }) => ctx.axioms.list()),
  createAxiom: t.procedure
    .input(createAxiomInput)
    .mutation(({ input, ctx }) => ctx.axioms.create(input)),
});

export type ApiRouter = typeof router;
