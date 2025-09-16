import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import {
  createAxiomModel,
  type AxiomModel,
  createBeingModel,
  type BeingModel,
  createSentimentModel,
  type SentimentModel,
} from "./persistence/entities/index.ts";
import { getDb } from "./persistence/db.ts";

export class Context {
  db: Awaited<ReturnType<typeof getDb>>;
  axioms: AxiomModel;
  beings: BeingModel;
  sentiments: SentimentModel;

  constructor({ db }: { db: Awaited<ReturnType<typeof getDb>> }) {
    this.db = db;
    this.axioms = createAxiomModel(this);
    this.beings = createBeingModel(this);
    this.sentiments = createSentimentModel(this);
  }
}

export const createContext = async (_opts: CreateExpressContextOptions) => {
  const db = await getDb();
  return new Context({ db });
};
