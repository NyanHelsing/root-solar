import { initTRPC } from "@trpc/server";
import { z } from "zod";

import { Axiom } from "./persistence/entities/index.ts";
import { type Context } from "./context.ts";

export const t = initTRPC.context<Context>().create();

export const router = t.router({
  listAxioms: t.procedure
    .input(z.string())
    .query(({ input, ctx }) => Axiom.find(ctx.em, input)),
  createAxiom: t.procedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(5),
        details: z.string().min(5),
      }),
    )
    .mutation(({ input, ctx }) => new Axiom(input).persist().flush()),
});

export type ApiRouter = typeof router;
