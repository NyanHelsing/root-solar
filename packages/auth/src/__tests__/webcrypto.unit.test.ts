import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getSubtleCrypto, getWebCrypto } from "../crypto/webcrypto.ts";

describe("auth/webcrypto", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");

    afterEach(() => {
        if (originalDescriptor) {
            Object.defineProperty(globalThis, "crypto", originalDescriptor);
        } else {
            Reflect.deleteProperty(globalThis, "crypto");
        }
    });

    it("returns the global crypto reference", () => {
        const cryptoMock = {
            subtle: {
                encrypt: async () => new ArrayBuffer(0)
            },
            getRandomValues(array: Uint8Array) {
                return array;
            }
        } as unknown as Crypto;

        Object.defineProperty(globalThis, "crypto", {
            configurable: true,
            value: cryptoMock
        });

        assert.equal(getWebCrypto(), cryptoMock);
        assert.equal(getSubtleCrypto(), cryptoMock.subtle);
    });

    it("throws when crypto is missing", () => {
        Object.defineProperty(globalThis, "crypto", {
            configurable: true,
            value: undefined
        });
        assert.throws(() => getWebCrypto(), /global crypto missing/);
    });

    it("throws when subtle crypto is missing", () => {
        Object.defineProperty(globalThis, "crypto", {
            configurable: true,
            value: {
                getRandomValues(array: Uint8Array) {
                    return array;
                }
            } as unknown as Crypto
        });

        assert.throws(() => getSubtleCrypto(), /subtle crypto missing/);
    });
});
