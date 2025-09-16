import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import {
  createAxiomModel,
  type AxiomModel,
} from "./persistence/entities/axiom/entity.ts";
import {
  createBeingModel,
  type BeingModel,
} from "./persistence/entities/being/entity.ts";
import { getDb } from "./persistence/db.ts";

export class Context {
  db: Awaited<ReturnType<typeof getDb>>;
  axioms: AxiomModel;
  beings: BeingModel;

  constructor({ db }: { db: Awaited<ReturnType<typeof getDb>> }) {
    this.db = db;
    this.axioms = createAxiomModel(this);
    this.beings = createBeingModel(this);
  }
}

export const createContext = async (_opts: CreateExpressContextOptions) => {
  const db = await getDb();
  return new Context({ db });
};
