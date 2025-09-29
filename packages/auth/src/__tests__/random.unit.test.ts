import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getRandomBytes } from "../random.ts";

describe("auth/random", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, "crypto", originalDescriptor);
    } else {
      // @ts-expect-error cleanup when crypto was not defined originally
      delete (globalThis as { crypto?: Crypto }).crypto;
    }
  });

  it("produces random bytes using global crypto", () => {
    let called = false;
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        getRandomValues(array: Uint8Array) {
          called = true;
          for (let index = 0; index < array.length; index += 1) {
            array[index] = index + 1;
          }
          return array;
        },
      } as unknown as Crypto,
    });

    const result = getRandomBytes(4);
    assert.equal(called, true);
    assert.deepEqual(Array.from(result), [1, 2, 3, 4]);
  });

  it("requires a positive integer length", () => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        getRandomValues(array: Uint8Array) {
          return array;
        },
      } as unknown as Crypto,
    });

    assert.throws(() => getRandomBytes(0), /positive integer/);
    assert.throws(() => getRandomBytes(1.5), /positive integer/);
  });

  it("throws when crypto is unavailable", () => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined,
    });
    assert.throws(() => getRandomBytes(2), /Secure random source unavailable/);
  });

  it("requires crypto.getRandomValues to be implemented", () => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {},
    });

    assert.throws(
      () => getRandomBytes(2),
      /getRandomValues not supported/,
    );
  });

  it("supports injecting a custom global scope for testing", () => {
    const fakeScope = {
      crypto: {
        getRandomValues(array: Uint8Array) {
          for (let index = 0; index < array.length; index += 1) {
            array[index] = 9;
          }
          return array;
        },
      },
    };

    const bytes = getRandomBytes(2, fakeScope as typeof globalThis);
    assert.deepEqual(Array.from(bytes), [9, 9]);

    assert.throws(
      () => getRandomBytes(2, null as unknown as typeof globalThis),
      /global scope missing/,
    );
  });
});
