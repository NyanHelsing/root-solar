import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { createAppLogger } from "@root-solar/observability";
import {
  createAxiomModel,
  type AxiomModel,
  createBeingModel,
  type BeingModel,
  createSentimentModel,
  type SentimentModel,
  createBeingRegistrationStore,
} from "./persistence/entities/index.ts";
import { getDb } from "./persistence/db.ts";
import type { BeingRegistrationStore } from "@root-solar/auth/procedures";

const apiContextLogger = createAppLogger("api:context", {
  tags: ["api", "context"],
});

export class Context {
  db: Awaited<ReturnType<typeof getDb>>;
  axioms: AxiomModel;
  beings: BeingModel;
  sentiments: SentimentModel;
  authRegistrations: BeingRegistrationStore;

  constructor({ db }: { db: Awaited<ReturnType<typeof getDb>> }) {
    this.db = db;
    this.axioms = createAxiomModel(this);
    this.beings = createBeingModel(this);
    this.sentiments = createSentimentModel(this);
    this.authRegistrations = createBeingRegistrationStore(this);
    apiContextLogger.debug("API context constructed", {
      tags: ["startup"],
    });
  }
}

export const createContext = async (_opts: CreateExpressContextOptions) => {
  apiContextLogger.debug("Creating API context", {
    tags: ["startup"],
  });
  const db = await getDb();
  apiContextLogger.debug("Database handle ready for API context", {
    tags: ["startup"],
  });
  return new Context({ db });
};
