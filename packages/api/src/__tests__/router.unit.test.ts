import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { TRPCError } from "@trpc/server";

const moduleSpecifier = "../router.ts";
const authProcedures = await import("../../../auth/src/procedures/index.ts");

describe("api/router", () => {
    it("routes requests through the context models", async () => {
        const startCalls: unknown[] = [];
        const completeCalls: unknown[] = [];

        await mock.module("@root-solar/net/status", {
            namedExports: {
                getNetworkStatus() {
                    return { state: "ready" };
                }
            }
        });

        await mock.module("@root-solar/auth/procedures", {
            namedExports: {
                ...authProcedures,
                createBeingRegistrationHandlers() {
                    return {
                        async start(input: unknown) {
                            startCalls.push(input);
                            return { challengeId: "challenge-1" };
                        },
                        async complete(input: unknown) {
                            completeCalls.push(input);
                            return { success: true };
                        }
                    };
                }
            }
        });

        const tagsList = [{ id: "tag:axiom", slug: "axiom", label: "Axiom" }];
        const commentsList = [{ id: "comment-1", body: "Comment" }];
        const sentimentsList = [
            {
                id: "sentiment-1",
                beingId: "being-1",
                subjectId: "missive:1",
                subjectTable: "missive",
                tagId: "tag:axiom",
                weight: 1,
                maxWeight: 5
            },
            {
                id: "sentiment-2",
                beingId: "being-1",
                subjectId: "missive:2",
                subjectTable: "missive",
                tagId: "tag:axiom",
                weight: 2,
                maxWeight: 5
            }
        ];

        const createdMissives: unknown[] = [];
        const updatedMissives: unknown[] = [];
        const taggedMissives: unknown[] = [];
        const ensuredTagDefinitions: unknown[] = [];
        const tagParentMutations: unknown[] = [];
        const removedMissiveTags: unknown[] = [];
        const upsertedSentiments: unknown[] = [];
        const removedSentiments: unknown[] = [];
        const createdComments: unknown[] = [];
        const listedSentimentsArgs: unknown[] = [];
        const ctx = {
            missives: {
                async list(params: { sentimentSlug?: string }) {
                    return [
                        { id: "missive:1", title: "First" },
                        { id: "missive:2", title: "Second" }
                    ].map((record) => ({ ...record, sentiment: params?.sentimentSlug }));
                },
                async get(id: string) {
                    if (id === "missive:missing") {
                        return null;
                    }
                    return { id, title: `Axiom ${id}` };
                },
                async create(input: unknown) {
                    createdMissives.push(input);
                    return { id: "missive:new", ...(input as Record<string, unknown>) };
                },
                async update(input: {
                    missiveId: string;
                    title: string;
                    details?: string;
                }) {
                    updatedMissives.push(input);
                    return { id: input.missiveId, title: input.title, details: input.details };
                },
                async addTag(input: { missiveId: string; tagSlug: string }) {
                    taggedMissives.push(input);
                    return {
                        id: input.missiveId,
                        title: `Axiom ${input.missiveId}`,
                        tags: [
                            {
                                id: `tag:${input.tagSlug}`,
                                slug: input.tagSlug,
                                label: input.tagSlug
                            }
                        ]
                    };
                },
                async removeTag(input: { missiveId: string; tagSlug: string }) {
                    removedMissiveTags.push(input);
                    return {
                        id: input.missiveId,
                        title: `Axiom ${input.missiveId}`,
                        tags: []
                    };
                }
            },
            tags: {
                async list() {
                    return tagsList;
                },
                async ensureMany(
                    definitions: Array<{ slug: string; label: string; tags?: string[] }>
                ) {
                    ensuredTagDefinitions.push(...definitions);
                    return definitions.map((definition) => ({
                        id: `tag:${definition.slug}`,
                        slug: definition.slug,
                        label: definition.label,
                        tags: definition.tags
                    }));
                },
                async addParent(input: { tagId: string; parentTagSlug: string }) {
                    tagParentMutations.push(input);
                    const normalizedId = input.tagId.includes(":")
                        ? input.tagId
                        : `tag:${input.tagId}`;
                    const slug = normalizedId.includes(":")
                        ? normalizedId.slice(normalizedId.indexOf(":") + 1)
                        : normalizedId;
                    return {
                        id: normalizedId,
                        slug,
                        label: slug,
                        tags: [`tag:${input.parentTagSlug}`]
                    };
                }
            },
            comments: {
                async listForAxiom() {
                    return commentsList;
                },
                async create(input: unknown) {
                    createdComments.push(input);
                    return { id: "comment:new", ...(input as Record<string, unknown>) };
                }
            },
            sentiments: {
                async listForBeing(beingId: string, options: unknown) {
                    listedSentimentsArgs.push({ beingId, options });
                    return sentimentsList;
                },
                async upsert(input: unknown) {
                    upsertedSentiments.push(input);
                    return { id: "sentiment:new", ...(input as Record<string, unknown>) };
                },
                async remove(input: unknown) {
                    removedSentiments.push(input);
                }
            },
            beings: {
                async create(input: unknown) {
                    return { id: "being:new", ...(input as Record<string, unknown>) };
                }
            },
            authRegistrations: {
                async persistChallenge() {},
                async loadChallenge() {
                    return null;
                },
                async completeChallenge() {}
            }
        };

        const routerModule = await import(`${moduleSpecifier}?case=${Date.now()}-router`);
        const caller = routerModule.router.createCaller(ctx);

        const axioms = await caller.listAxioms({ sentiment: "axiom" });
        assert.equal(axioms[0].sentiment, "axiom");

        const tags = await caller.listTags();
        assert.deepEqual(tags, tagsList);

        const detailed = await caller.getAxiom({ axiomId: "missive:1", beingId: "being-1" });
        assert.equal(detailed.comments.length, 1);
        assert.equal(detailed.sentiments.length, 1);

        const missing = await caller.getAxiom({ axiomId: "missive:missing" });
        assert.equal(missing, null);

        await caller.createMissive({
            title: "Missive title",
            details: "Details",
            tagSlugs: ["axiom"]
        });

        await caller.createAxiom({
            title: "Axiom title",
            details: "Details",
            tagSlugs: ["axiom"]
        });

        assert.equal(createdMissives.length, 2);

        await caller.updateMissive({
            missiveId: "missive:1",
            title: "Updated title",
            details: "Updated details"
        });
        assert.deepEqual(updatedMissives.at(-1), {
            missiveId: "missive:1",
            title: "Updated title",
            details: "Updated details"
        });

        await caller.addMissiveTag({ missiveId: "missive:1", tagSlug: "focus" });
        assert.deepEqual(taggedMissives[0], { missiveId: "missive:1", tagSlug: "focus" });

        await caller.addMissiveTag({ missiveId: "missive:2", tagSlug: "tag:Focus" });
        assert.deepEqual(taggedMissives[1], { missiveId: "missive:2", tagSlug: "focus" });

        await caller.addTagTag({ tagId: "tag:axiom", tagSlug: "meta" });
        assert.deepEqual(tagParentMutations[0], { tagId: "tag:axiom", parentTagSlug: "meta" });

        await caller.removeMissiveTag({ missiveId: "missive:1", tagSlug: "focus" });
        assert.deepEqual(removedMissiveTags[0], { missiveId: "missive:1", tagSlug: "focus" });

        await caller.setSentiment({
            beingId: "being-1",
            subjectId: "missive:1",
            tagId: "tag:axiom",
            weight: 2
        });
        assert.deepEqual(upsertedSentiments[0], {
            beingId: "being-1",
            subjectId: "missive:1",
            subjectTable: "missive",
            tagId: "tag:axiom",
            weight: 2,
            maxWeight: undefined
        });

        await caller.listSentimentsForBeing({ beingId: "being-1" });
        const lastSentimentArgs = listedSentimentsArgs.at(-1) as {
            beingId: string;
            options: { tagId?: string; subjectTable?: string };
        };
        assert.deepEqual(lastSentimentArgs, {
            beingId: "being-1",
            options: {
                tagId: undefined,
                subjectTable: "missive"
            }
        });

        await caller.removeSentiment({
            beingId: "being-1",
            subjectId: "missive:1",
            tagId: "tag:axiom"
        });
        assert.equal(removedSentiments.length, 1);

        await caller.addAxiomComment({
            axiomId: "missive:1",
            authorBeingId: "being-2",
            authorDisplayName: "Being Two",
            body: "Thought"
        });
        assert.equal(createdComments.length, 1);

        await assert.rejects(
            caller.addAxiomComment({
                axiomId: "missive:missing",
                authorBeingId: "being-2",
                authorDisplayName: "Being Two",
                body: "Thought"
            }),
            (error) => error instanceof TRPCError && error.code === "NOT_FOUND"
        );

        await caller.startBeingRegistration({
            name: "Being Two",
            request: {
                payload: {
                    signingPublicKey: "sign",
                    encryptionPublicKey: "enc",
                    signature: "sig"
                },
                message: "message"
            }
        });

        await caller.completeBeingRegistration({
            response: {
                challengeId: "challenge-1",
                signature: "sig"
            }
        });

        assert.equal(startCalls.length, 1);
        assert.equal(completeCalls.length, 1);

        const status = await caller.networkStatus();
        assert.equal(status.state, "ready");

        mock.restoreAll();
    });
});
