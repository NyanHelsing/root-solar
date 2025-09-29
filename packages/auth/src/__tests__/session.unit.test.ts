import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import type { webcrypto } from "node:crypto";
import type { BeingCredentialBundle } from "../session.ts";

type FakeLocalStorage = {
  store: Map<string, string>;
  setItem: (key: string, value: string) => void;
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
};

type CryptoLike = webcrypto.Crypto;
type CryptoKeyLike = webcrypto.CryptoKey;
type CryptoKeyPairLike = webcrypto.CryptoKeyPair;

let importCounter = 0;

const createStorage = (): FakeLocalStorage => {
  const map = new Map<string, string>();
  return {
    store: map,
    setItem: (key, value) => {
      map.set(key, value);
    },
    getItem: (key) => map.get(key) ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
  } satisfies FakeLocalStorage;
};

const defineBrowserEnvironment = (storage: FakeLocalStorage, crypto: CryptoLike) => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: storage,
      crypto,
    },
  });
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: crypto,
  });
};

afterEach(() => {
  if ("crypto" in globalThis) {
    // @ts-expect-error cleanup test crypto shim
    delete (globalThis as { crypto?: Crypto }).crypto;
  }
  if ("window" in globalThis) {
    // @ts-expect-error cleanup test window shim
    delete (globalThis as { window?: unknown }).window;
  }
});

describe("auth/session", () => {
  it("generates a pin, persists, loads, and unlocks session records", async () => {
    const storage = createStorage();
    const randomSequences: Array<Uint8Array> = [
      Uint8Array.from([0xea, 0x60]),
      Uint8Array.from([0x00, 0x2a]),
      Uint8Array.from({ length: 16 }, (_, index) => index),
      Uint8Array.from({ length: 12 }, (_, index) => index + 16),
    ];

    const cryptoMock: CryptoLike = {
      getRandomValues<T extends ArrayBufferView>(array: T) {
        const next = randomSequences.shift();
        if (!next || next.length !== array.byteLength) {
          throw new Error("Unexpected random byte request");
        }
        (array as Uint8Array).set(next);
        return array;
      },
      subtle: {
        async importKey() {
          return { type: "import" } as CryptoKeyLike;
        },
        async deriveKey() {
          return { type: "derived" } as CryptoKeyLike;
        },
        async encrypt(_algorithm: unknown, _key: CryptoKeyLike, data: BufferSource) {
          const source = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer);
          return source.slice().buffer;
        },
        async decrypt(_algorithm: unknown, _key: CryptoKeyLike, data: BufferSource) {
          const source = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer);
          return source.slice().buffer;
        },
        exportKey: async () => new ArrayBuffer(0),
        generateKey: async () => ({}) as CryptoKeyPairLike,
        sign: async () => new ArrayBuffer(0),
        unwrapKey: async () => ({}),
        verify: async () => true,
        wrapKey: async () => new ArrayBuffer(0),
      },
    } as Crypto;

    defineBrowserEnvironment(storage, cryptoMock);

    const bundle: BeingCredentialBundle = {
      beingId: "being-123",
      beingName: "Being 123",
      signing: {
        privateKey: "sign-private",
        publicKey: "sign-public",
      },
      encryption: {
        privateKey: "enc-private",
        publicKey: "enc-public",
      },
    };

    const session = await import(`../session.ts?test=${importCounter += 1}`);

    const pin = session.generateSessionPin();
    assert.equal(pin, "0042");

    const record = await session.createBeingSessionRecord(bundle, pin);
    assert.equal(record.being.id, "being-123");
    assert.match(record.createdAt, /T.*Z/);

    session.persistBeingSessionRecord(record);
    assert.equal(storage.store.size, 1);

    const loaded = session.loadBeingSessionRecord();
    assert.ok(loaded);
    assert.equal(loaded?.being.id, "being-123");

    const unlocked = await session.unlockBeingSessionRecord(record, pin);
    assert.deepEqual(unlocked, bundle);

    session.clearBeingSessionRecord();
    assert.equal(storage.store.size, 0);
  });

  it("removes invalid stored records when loading", async () => {
    const storage = createStorage();
    storage.setItem("root.solar/being-session", "corrupt");

    const cryptoMock: CryptoLike = {
      getRandomValues<T extends ArrayBufferView>(array: T) {
        return array;
      },
      subtle: {
        async importKey() {
          return { type: "import" } as CryptoKeyLike;
        },
        async deriveKey() {
          return { type: "derived" } as CryptoKeyLike;
        },
        async encrypt() {
          return new ArrayBuffer(0);
        },
        async decrypt() {
          return new ArrayBuffer(0);
        },
        exportKey: async () => new ArrayBuffer(0),
        generateKey: async () => ({}) as CryptoKeyPairLike,
        sign: async () => new ArrayBuffer(0),
        unwrapKey: async () => ({}),
        verify: async () => true,
        wrapKey: async () => new ArrayBuffer(0),
      },
    } as Crypto;

    defineBrowserEnvironment(storage, cryptoMock);

    const session = await import(`../session.ts?test=${importCounter += 1}`);
    const value = session.loadBeingSessionRecord();
    assert.equal(value, null);
    assert.equal(storage.store.size, 0);
  });

  it("creates sessions and persists them to storage", async () => {
    const storage = createStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          ...storage,
          setItem: storage.setItem.bind(storage),
          getItem: storage.getItem.bind(storage),
          removeItem: storage.removeItem.bind(storage),
        },
      },
    });

    const cryptoMock: CryptoLike = {
      getRandomValues<T extends ArrayBufferView>(array: T) {
        return array;
      },
      subtle: {
        async importKey() {
          return {} as CryptoKeyLike;
        },
        async deriveKey() {
          return {} as CryptoKeyLike;
        },
        async encrypt(_algorithm: unknown, _key: CryptoKeyLike, data: BufferSource) {
          const source = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer);
          return source.slice().buffer;
        },
        async decrypt(_algorithm: unknown, _key: CryptoKeyLike, data: BufferSource) {
          const source = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer);
          return source.slice().buffer;
        },
        exportKey: async () => new ArrayBuffer(0),
        generateKey: async () => ({}) as CryptoKeyPairLike,
        sign: async () => new ArrayBuffer(0),
        unwrapKey: async () => ({}),
        verify: async () => true,
        wrapKey: async () => new ArrayBuffer(0),
      },
    } as Crypto;

    defineBrowserEnvironment(storage, cryptoMock);

    const session = await import(`../session.ts?test=${importCounter += 1}`);

    const bundle: BeingCredentialBundle = {
      beingId: "being-42",
      beingName: "Being 42",
      signing: { publicKey: "sign-public", privateKey: "sign-private" },
      encryption: { publicKey: "enc-public", privateKey: "enc-private" },
    };

    const { pin, record } = await session.createBeingSession(bundle);
    assert.equal(pin.length, 4);
    assert.ok(storage.store.has("root.solar/being-session"));
    const unlocked = await session.unlockBeingSessionRecord(record, pin);
    assert.equal(unlocked.beingId, "being-42");
  });

  it("reports persistence failures", async () => {
    const storage = {
      setItem() {
        throw new Error("denied");
      },
    };

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });

    const session = await import(`../session.ts?test=${importCounter += 1}`);

    const record: BeingCredentialBundle = {
      beingId: "being-1",
      signing: { publicKey: "sign-public", privateKey: "sign-private" },
      encryption: { publicKey: "enc-public", privateKey: "enc-private" },
    } as unknown as BeingCredentialBundle;

    await assert.rejects(async () => {
      session.persistBeingSessionRecord({
        version: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        being: {
          id: "being-1",
          name: "Being",
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
      });
    }, /Failed to persist session/);
  });

  it("handles non-browser environments when loading and clearing", async () => {
    // Ensure window is not defined
    if ("window" in globalThis) {
      // @ts-expect-error test cleanup
      delete (globalThis as { window?: unknown }).window;
    }

    const session = await import(`../session.ts?test=${importCounter += 1}`);
    assert.equal(session.loadBeingSessionRecord(), null);
    session.clearBeingSessionRecord();
  });
});
