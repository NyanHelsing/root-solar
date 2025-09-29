import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
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

afterEach(() => {
  mock.restoreAll();
  if (typeof window !== "undefined") {
    delete globalThis.window;
  }
});

describe("auth/beings", () => {
  it("returns the guest profile when no session exists", async () => {
    const storage = createStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });

    const beings = await import("../beings.ts");
    const store = createStore();

    const being = store.get(beings.beingAtom);
    assert.equal(being.id, "guest");
    assert.equal(being.name, "Guest");
    assert.equal(being.role, "participant");
  });

  it("derives the active being from the session atom", async () => {
    const storage = createStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });

    const sessionRecord = {
      version: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      being: {
        id: "being-42",
        name: "  Being Forty Two  ",
        signingPublicKey: "sign",
        encryptionPublicKey: "enc",
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

    storage.setItem(STORAGE_KEY, JSON.stringify(sessionRecord));

    const sessionAtoms = await import("../session-atoms.ts");
    const beings = await import("../beings.ts");

    const store = createStore();
    store.set(sessionAtoms.beingSessionAtom, {
      type: "set",
      record: sessionRecord,
    });

    const being = store.get(beings.beingAtom);
    assert.equal(being.id, "being-42");
    assert.equal(being.name.trim(), "Being Forty Two");
  });

  it("returns the stored being when no active session is available", async () => {
    const storage = createStorage();
    const sessionRecord = {
      version: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      being: {
        id: "being-99",
        name: "  Oracle  ",
        signingPublicKey: "sign",
        encryptionPublicKey: "enc",
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

    storage.setItem(STORAGE_KEY, JSON.stringify(sessionRecord));

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });

    const beings = await import(`../beings.ts?test=${Date.now()}-stored`);
    const store = createStore();
    const being = store.get(beings.beingAtom);
    assert.equal(being.id, "being-99");
    assert.equal(being.name, "Oracle");
  });

  it("logs a warning when stored session resolution fails", async () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: {} },
    });

    const sessionModule = await import("../session.ts");

    await mock.module("../session.ts", {
      namedExports: {
        ...sessionModule,
        loadBeingSessionRecord() {
          throw new Error("load failure");
        },
      },
    });

    const warn = mock.method(console, "warn");
    const beings = await import(`../beings.ts?test=${Date.now()}-warn`);
    const store = createStore();
    const being = store.get(beings.beingAtom);

    assert.equal(being.id, "guest");
    assert.equal(warn.mock.callCount(), 1);
  });

  it("returns the guest profile when loading the stored session fails", async () => {
    const storage = {
      setItem() {},
      getItem() {
        throw new Error("failure");
      },
      removeItem() {},
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });

    const beings = await import(`../beings.ts?test=${Date.now()}-error`);
    const store = createStore();
    const being = store.get(beings.beingAtom);
    assert.equal(being.id, "guest");
  });
});
