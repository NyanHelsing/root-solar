import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as openpgp from "openpgp";

import { toBase64 } from "../encoding.ts";
import { buildAuthMessage } from "../handshake/build-auth-message.ts";
import { createAuthRequest } from "../handshake/create-auth-request.ts";
import { normalizeIntent } from "../handshake/normalize-intent.ts";
import type { AuthIntent } from "../handshake/types.ts";
import { BEING_KEY_MATERIAL, BEING_SIGNING_PUBLIC_KEY } from "./fixtures/pgp-keys.ts";

const verifySignature = async (messageBytes: Uint8Array, signature: string) => {
    const message = await openpgp.createMessage({ binary: messageBytes });
    const signatureObject = await openpgp.readSignature({
        armoredSignature: signature,
    });
    const verificationKey = await openpgp.readKey({
        armoredKey: BEING_SIGNING_PUBLIC_KEY,
    });
    const { signatures } = await openpgp.verify({
        message,
        signature: signatureObject,
        verificationKeys: verificationKey,
    });
    const [first] = signatures;
    assert.ok(first, "expected at least one signature");
    await first.verified;
};

describe("createAuthRequest", () => {
    it("creates an auth request when provided a string intent", async () => {
        const intent = "coordinate";
        const intentBytes = normalizeIntent(intent);
        assert.ok(intentBytes, "expected normalized intent bytes");
        const expectedMessageBytes = buildAuthMessage(
            BEING_KEY_MATERIAL.signing.publicKey,
            BEING_KEY_MATERIAL.encryption.publicKey,
            intentBytes,
        );

        const request = await createAuthRequest(BEING_KEY_MATERIAL, {
            intent,
        });

        assert.equal(request.payload.signingPublicKey, BEING_KEY_MATERIAL.signing.publicKey);
        assert.equal(request.payload.encryptionPublicKey, BEING_KEY_MATERIAL.encryption.publicKey);
        assert.equal(request.payload.intent, toBase64(intentBytes));
        assert.equal(request.message, toBase64(expectedMessageBytes));
        await verifySignature(expectedMessageBytes, request.payload.signature);
    });

    it("omits the intent field when none is provided", async () => {
        const expectedMessageBytes = buildAuthMessage(
            BEING_KEY_MATERIAL.signing.publicKey,
            BEING_KEY_MATERIAL.encryption.publicKey,
            undefined,
        );

        const request = await createAuthRequest(BEING_KEY_MATERIAL);

        assert.equal(request.payload.intent, undefined);
        assert.equal(request.message, toBase64(expectedMessageBytes));
        await verifySignature(expectedMessageBytes, request.payload.signature);
    });

    it("supports binary intents and armored Uint8Array signatures", async () => {
        const intentBytes = new TextEncoder().encode("intent-bytes");
        const expectedMessageBytes = buildAuthMessage(
            BEING_KEY_MATERIAL.signing.publicKey,
            BEING_KEY_MATERIAL.encryption.publicKey,
            intentBytes,
        );

        const request = await createAuthRequest(BEING_KEY_MATERIAL, {
            intent: intentBytes as AuthIntent,
        });

        assert.equal(request.payload.intent, toBase64(intentBytes));
        await verifySignature(expectedMessageBytes, request.payload.signature);
    });
});
