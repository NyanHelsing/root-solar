import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { createAxiomModel, type AxiomModel } from "./persistence/entities/axiom/entity.ts";
import { getDb } from "./persistence/db.ts";

export class Context {
  db: Awaited<ReturnType<typeof getDb>>;
  axioms: AxiomModel;

  constructor({ db }: { db: Awaited<ReturnType<typeof getDb>> }) {
    this.db = db;
    this.axioms = createAxiomModel(this);
  }
}

export const createContext = async (_opts: CreateExpressContextOptions) => {
  const db = await getDb();
  return new Context({ db });
};
