import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import globalJsdom from "global-jsdom";
import { createStore } from "jotai";

const STORAGE_KEY = "root.solar/being-session";

const createStorage = () => {
    const map = new Map();
    return {
        store: map,
        setItem(key, value) {
            map.set(key, value);
        },
        getItem(key) {
            return map.get(key) ?? null;
        },
        removeItem(key) {
            map.delete(key);
        },
    };
};

let restoreDom: (() => void) | undefined;

beforeEach(() => {
    restoreDom = globalJsdom(undefined, { url: "https://root.solar/" });
});

afterEach(() => {
    mock.restoreAll();
    restoreDom?.();
    restoreDom = undefined;
});

describe("auth/session-atoms", () => {
    it("reflects and mutates the current session", async () => {
        const storage = createStorage();
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: storage,
        });

        const baseRecord = {
            version: 1,
            createdAt: "2024-01-01T00:00:00.000Z",
            being: {
                id: "being-1",
                name: "Being One",
                signingPublicKey: "sign-public",
                encryptionPublicKey: "enc-public",
            },
            encryptedBundle: {
                algorithm: "AES-GCM",
                ciphertext: "cipher",
                iv: "iv",
                salt: "salt",
                iterations: 1,
                hash: "SHA-256",
                keyLength: 256,
            },
        };

        storage.setItem(STORAGE_KEY, JSON.stringify(baseRecord));

        const atoms = await import(`../session-atoms.ts?test=${Date.now()}`);
        const store = createStore();

        const initialSession = store.get(atoms.beingSessionAtom);
        assert.ok(initialSession);
        assert.equal(initialSession.being.id, "being-1");

        const summary = store.get(atoms.beingSessionSummaryAtom);
        assert.ok(summary);
        assert.equal(summary.beingId, "being-1");
        assert.equal(summary.displayName, "Being One");

        const nextRecord = {
            ...baseRecord,
            being: {
                ...baseRecord.being,
                id: "being-2",
                name: "Second Being",
            },
        };

        store.set(atoms.beingSessionAtom, { type: "set", record: nextRecord });
        const updated = store.get(atoms.beingSessionAtom);
        assert.equal(updated.being.id, "being-2");

        store.set(atoms.beingSessionAtom, { type: "clear" });
        const cleared = store.get(atoms.beingSessionAtom);
        assert.equal(cleared, null);
        assert.equal(storage.store.has(STORAGE_KEY), false);
    });

    it("falls back to null when loading the initial session fails", async () => {
        const sessionModule = await import("../session.ts");

        await mock.module("../session.ts", {
            namedExports: {
                ...sessionModule,
                loadBeingSessionRecord() {
                    throw new Error("boom");
                },
                clearBeingSessionRecord: sessionModule.clearBeingSessionRecord,
            },
        });

        const atoms = await import(`../session-atoms.ts?test=${Date.now()}-error`);
        const store = createStore();
        const value = store.get(atoms.beingSessionAtom);
        assert.equal(value, null);
        mock.restoreAll();
    });
});
