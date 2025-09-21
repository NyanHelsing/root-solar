import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { createAppLogger } from "@root-solar/observability";
import {
  createMissiveModel,
  type MissiveModel,
  createBeingModel,
  type BeingModel,
  createSentimentModel,
  type SentimentModel,
  createBeingRegistrationStore,
  createCommentModel,
  type CommentModel,
} from "./persistence/entities/index.ts";
import { getDb } from "./persistence/db.ts";
import type { BeingRegistrationStore } from "@root-solar/auth/procedures";

const apiContextLogger = createAppLogger("api:context", {
  tags: ["api", "context"],
});

export class Context {
  db: Awaited<ReturnType<typeof getDb>>;
  missives: MissiveModel;
  beings: BeingModel;
  sentiments: SentimentModel;
  comments: CommentModel;
  authRegistrations: BeingRegistrationStore;

  constructor({ db }: { db: Awaited<ReturnType<typeof getDb>> }) {
    this.db = db;
    this.missives = createMissiveModel(this);
    this.beings = createBeingModel(this);
    this.sentiments = createSentimentModel(this);
    this.comments = createCommentModel(this);
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
