import assert from "node:assert/strict";
import { describe, it } from "node:test";

const moduleSpecifier = "../being-registration.ts";

describe("auth/being-registration store", () => {
    const createContext = (overrides = {}) => ({
        db: {
            async upsert() {},
            async select() {
                return null;
            },
            async delete() {}
        },
        ...overrides
    });

    it("persists challenges with pending status", async () => {
        const upsertCalls = [];

        const ctx = createContext({
            db: {
                async upsert(_id, payload) {
                    upsertCalls.push(payload);
                },
                async select() {
                    return null;
                },
                async delete() {}
            }
        });

        const { createBeingRegistrationStore } = await import(
            `${moduleSpecifier}?case=${Date.now()}-persist`
        );
        const store = createBeingRegistrationStore(ctx);

        await store.persistChallenge({
            challengeId: "challenge-1",
            beingId: "being-1",
            beingName: "Being One",
            signingPublicKey: "sign",
            encryptionPublicKey: "enc",
            intentBase64: "intent",
            messageBase64: "message"
        });

        assert.equal(upsertCalls.length, 1);
        assert.equal(upsertCalls[0].status, "pending");
    });

    it("loads pending challenges and ignores completed ones", async () => {
        const ctx = createContext({
            db: {
                async select(id) {
                    const identifier = typeof id === "string" ? id : (id?.toString?.() ?? "");
                    if (identifier.includes("pending")) {
                        return {
                            id: "challenge-pending",
                            status: "pending",
                            challengeId: "challenge-pending",
                            nonce: "nonce",
                            idpSigningKeyPair: { publicKey: "pub", privateKey: "priv" },
                            beingSigningPublicKey: "sign",
                            beingEncryptionPublicKey: "enc",
                            beingName: "Being",
                            intentBase64: undefined,
                            messageBase64: "message"
                        };
                    }
                    if (identifier.includes("done")) {
                        return {
                            id: "challenge-done",
                            status: "completed",
                            challengeId: "challenge-done",
                            nonce: "nonce",
                            idpSigningKeyPair: { publicKey: "pub", privateKey: "priv" },
                            beingSigningPublicKey: "sign",
                            beingEncryptionPublicKey: "enc",
                            beingName: "Being",
                            intentBase64: undefined,
                            messageBase64: "message"
                        };
                    }
                    return [];
                },
                async upsert() {},
                async delete() {}
            }
        });

        const { createBeingRegistrationStore } = await import(
            `${moduleSpecifier}?case=${Date.now()}-load`
        );
        const store = createBeingRegistrationStore(ctx);

        const pending = await store.loadChallenge("challenge-pending");
        assert.equal(pending.challengeId, "challenge-pending");

        const completed = await store.loadChallenge("challenge-done");
        assert.equal(completed, null);

        const missing = await store.loadChallenge("missing");
        assert.equal(missing, null);
    });

    it("completes challenges by deleting records", async () => {
        let deletedId: unknown;

        const ctx = createContext({
            db: {
                async delete(id) {
                    deletedId = id;
                },
                async upsert() {},
                async select() {
                    return null;
                }
            }
        });

        const { createBeingRegistrationStore } = await import(
            `${moduleSpecifier}?case=${Date.now()}-complete`
        );
        const store = createBeingRegistrationStore(ctx);

        await store.completeChallenge("challenge-1");
        assert.ok(deletedId);
    });
});
