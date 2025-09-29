import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bytesToUtf8,
  concatBytes,
  fromBase64,
  toBase64,
  utf8ToBytes,
} from "../encoding.ts";

describe("auth/encoding", () => {
  it("encodes and decodes UTF-8 strings", () => {
    const text = "Root Solar";
    const bytes = utf8ToBytes(text);
    assert.deepEqual(Array.from(bytes), Array.from(new TextEncoder().encode(text)));
    assert.equal(bytesToUtf8(bytes), text);
  });

  it("roundtrips Base64 using Buffer", () => {
    const input = Uint8Array.from([1, 2, 3, 4]);
    const encoded = toBase64(input);
    assert.equal(encoded, Buffer.from(input).toString("base64"));
    assert.deepEqual(fromBase64(encoded), input);
  });

  it("falls back to browser APIs when Buffer is unavailable", () => {
    const originalBuffer = globalThis.Buffer;
    const originalBtoa = (globalThis as { btoa?: typeof btoa }).btoa;
    const originalAtob = (globalThis as { atob?: typeof atob }).atob;

    const backing = Buffer;

    // @ts-expect-error overriding for test coverage
    globalThis.Buffer = undefined;
    (globalThis as { btoa?: typeof btoa }).btoa = (value) =>
      backing.from(value, "binary").toString("base64");
    (globalThis as { atob?: typeof atob }).atob = (value) =>
      backing.from(value, "base64").toString("binary");

    try {
      const bytes = Uint8Array.from([5, 6, 7]);
      const encoded = toBase64(bytes);
      assert.equal(encoded, backing.from(bytes).toString("base64"));
      assert.deepEqual(fromBase64(encoded), bytes);
    } finally {
      // @ts-expect-error restoring global Buffer
      globalThis.Buffer = originalBuffer;
      (globalThis as { btoa?: typeof btoa | undefined }).btoa = originalBtoa;
      (globalThis as { atob?: typeof atob | undefined }).atob = originalAtob;
    }
  });

  it("throws when no Base64 implementation exists", () => {
    const originalBuffer = globalThis.Buffer;
    const originalBtoa = (globalThis as { btoa?: typeof btoa }).btoa;
    const originalAtob = (globalThis as { atob?: typeof atob }).atob;

    // @ts-expect-error overriding for test coverage
    globalThis.Buffer = undefined;
    (globalThis as { btoa?: typeof btoa | undefined }).btoa = undefined;
    (globalThis as { atob?: typeof atob | undefined }).atob = undefined;

    try {
      assert.throws(() => {
        toBase64(Uint8Array.from([1]));
      }, /Base64 encoding not supported/);
      assert.throws(() => {
        fromBase64("AQ==");
      }, /Base64 decoding not supported/);
    } finally {
      // @ts-expect-error restoring global Buffer
      globalThis.Buffer = originalBuffer;
      (globalThis as { btoa?: typeof btoa | undefined }).btoa = originalBtoa;
      (globalThis as { atob?: typeof atob | undefined }).atob = originalAtob;
    }
  });

  it("concatenates Uint8Arrays", () => {
    const result = concatBytes(Uint8Array.from([1, 2]), Uint8Array.from([3]));
    assert.deepEqual(Array.from(result), [1, 2, 3]);
  });
});
