import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { createAppLogger } from "@root-solar/observability";
import {
    createMissiveModel,
    type MissiveModel,
    type AxiomModel,
    createBeingModel,
    type BeingModel,
    createTagModel,
    type TagModel,
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

export type ContextFactories = {
    createTagModel: typeof createTagModel;
    createMissiveModel: typeof createMissiveModel;
    createBeingModel: typeof createBeingModel;
    createSentimentModel: typeof createSentimentModel;
    createCommentModel: typeof createCommentModel;
    createBeingRegistrationStore: typeof createBeingRegistrationStore;
};

const defaultFactories: ContextFactories = {
    createTagModel,
    createMissiveModel,
    createBeingModel,
    createSentimentModel,
    createCommentModel,
    createBeingRegistrationStore,
};

export class Context {
    db: Awaited<ReturnType<typeof getDb>>;
    missives: MissiveModel;
    axioms: AxiomModel;
    beings: BeingModel;
    tags: TagModel;
    sentiments: SentimentModel;
    comments: CommentModel;
    authRegistrations: BeingRegistrationStore;

    constructor({
        db,
        factories = defaultFactories,
    }: {
        db: Awaited<ReturnType<typeof getDb>>;
        factories?: ContextFactories;
    }) {
        this.db = db;
        this.tags = factories.createTagModel(this);
        this.missives = factories.createMissiveModel(this);
        this.axioms = this.missives;
        this.beings = factories.createBeingModel(this);
        this.sentiments = factories.createSentimentModel(this);
        this.comments = factories.createCommentModel(this);
        this.authRegistrations = factories.createBeingRegistrationStore(this);
        apiContextLogger.debug("API context constructed", {
            tags: ["startup"],
        });
    }
}

type CreateContextDependencies = {
    getDb: typeof getDb;
    factories: ContextFactories;
};

const defaultDependencies: CreateContextDependencies = {
    getDb,
    factories: defaultFactories,
};

export const createContext = async (
    _opts: CreateExpressContextOptions,
    dependencies: Partial<CreateContextDependencies> = {},
) => {
    apiContextLogger.debug("Creating API context", {
        tags: ["startup"],
    });
    const resolvedDependencies = {
        ...defaultDependencies,
        ...dependencies,
        factories: {
            ...defaultDependencies.factories,
            ...(dependencies.factories ?? {}),
        },
    } as CreateContextDependencies;
    const db = await resolvedDependencies.getDb();
    apiContextLogger.debug("Database handle ready for API context", {
        tags: ["startup"],
    });
    return new Context({ db, factories: resolvedDependencies.factories });
};
