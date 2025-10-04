import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

const moduleSpecifier = "../identities.ts";

describe("auth/identities", () => {
    it("generates signing and encryption key pairs with expected parameters", async () => {
        const generateCalls = [];

        await mock.module("openpgp", {
            namedExports: {
                async generateKey(options) {
                    generateCalls.push(options);
                    return {
                        publicKey: `public-${options.curve}`,
                        privateKey: `private-${options.curve}`,
                    };
                },
            },
        });

        const identities = await import(`${moduleSpecifier}?case=${Date.now()}`);

        const signing = await identities.generateSigningKeyPair();
        const encryption = await identities.generateEncryptionKeyPair();
        const material = await identities.generateBeingKeyMaterial();

        assert.deepEqual(generateCalls, [
            {
                type: "ecc",
                curve: "ed25519",
                userIDs: [{ name: "root.solar-being-signing" }],
                format: "armored",
            },
            {
                type: "ecc",
                curve: "curve25519",
                userIDs: [{ name: "root.solar-being-encryption" }],
                format: "armored",
            },
            {
                type: "ecc",
                curve: "ed25519",
                userIDs: [{ name: "root.solar-being-signing" }],
                format: "armored",
            },
            {
                type: "ecc",
                curve: "curve25519",
                userIDs: [{ name: "root.solar-being-encryption" }],
                format: "armored",
            },
        ]);

        assert.deepEqual(signing, {
            publicKey: "public-ed25519",
            privateKey: "private-ed25519",
        });
        assert.deepEqual(encryption, {
            publicKey: "public-curve25519",
            privateKey: "private-curve25519",
        });
        assert.deepEqual(material, {
            signing: {
                publicKey: "public-ed25519",
                privateKey: "private-ed25519",
            },
            encryption: {
                publicKey: "public-curve25519",
                privateKey: "private-curve25519",
            },
        });

        mock.restoreAll();
    });
});
