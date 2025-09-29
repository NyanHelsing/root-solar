import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

type WritableWindow = {
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
  crypto?: unknown;
};

const moduleSpecifier = "../session.ts";
let importCounter = 0;

const loadSessionModule = async () =>
  import(`${moduleSpecifier}?case=${Date.now()}-${importCounter += 1}`);

const setWindow = (overrides: Partial<WritableWindow>) => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("unexpected setItem call");
        },
        removeItem: () => {
          throw new Error("unexpected removeItem call");
        },
      },
      ...overrides,
    },
  });
};

afterEach(() => {
  mock.restoreAll();
  if ("window" in globalThis) {
    // @ts-expect-error cleanup injected window stub
    delete (globalThis as { window?: unknown }).window;
  }
});

describe("auth/session edge cases", { concurrency: false }, () => {
  it("continues sampling random values until within the accept bound", async () => {
    const originalCrypto = globalThis.crypto;
    const sequences = [
      Uint8Array.from([0xff, 0xff]),
      Uint8Array.from([0x00, 0x2a]),
    ];
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        getRandomValues<T extends ArrayBufferView>(array: T) {
          const next = sequences.shift();
          if (!next) {
            throw new Error("no random samples remaining");
          }
          (array as Uint8Array).set(next);
          return array;
        },
      },
    });
    const session = await loadSessionModule();
    assert.equal(session.generateSessionPin(), "0042");
    if (originalCrypto) {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: originalCrypto,
      });
    } else {
      // @ts-expect-error cleanup test crypto shim
      delete (globalThis as { crypto?: unknown }).crypto;
    }
  });

  it("throws when persisting outside of a browser environment", async () => {
    const session = await loadSessionModule();

    assert.throws(
      () =>
        session.persistBeingSessionRecord({
          version: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          being: {
            id: "being-1",
            name: "Being",
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
        }),
      /Failed to persist session to local storage/,
    );
  });

  it("ignores clear requests when local storage is unavailable", async () => {
    const session = await loadSessionModule();
    assert.doesNotThrow(() => session.clearBeingSessionRecord());
  });

  it("logs and clears invalid stored sessions", async () => {
    const warn = mock.method(console, "warn");
    setWindow({
      localStorage: {
        getItem: () => "{not-json",
        setItem: () => {
          throw new Error("setItem should not be called");
        },
        removeItem: () => {
          /* clear succeeds */
        },
      },
    });

    const session = await loadSessionModule();
    const value = session.loadBeingSessionRecord();
    assert.equal(value, null);
    assert.equal(warn.mock.calls.length, 1);
  });

  it("continues when invalid data cannot be removed", async () => {
    const warn = mock.method(console, "warn");
    setWindow({
      localStorage: {
        getItem: () => "{not-json",
        setItem: () => {
          throw new Error("setItem should not be called");
        },
        removeItem: () => {
          throw new Error("remove failure");
        },
      },
    });

    const session = await loadSessionModule();
    const value = session.loadBeingSessionRecord();
    assert.equal(value, null);
    assert.equal(warn.mock.calls.length, 2);
  });

  it("swallows errors when clearing the session storage fails", async () => {
    const warn = mock.method(console, "warn");
    setWindow({
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("setItem should not be called");
        },
        removeItem: () => {
          throw new Error("clear failure");
        },
      },
    });

    const session = await loadSessionModule();
    session.clearBeingSessionRecord();
    assert.equal(warn.mock.calls.length, 1);
  });

  it("exposes the session storage key", async () => {
    const session = await loadSessionModule();
    assert.equal(session.getSessionStorageKey(), "root.solar/being-session");
  });
});
