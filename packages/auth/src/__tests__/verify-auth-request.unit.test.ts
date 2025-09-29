import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAuthMessage } from "../handshake/build-auth-message.ts";
import { createAuthRequest } from "../handshake/create-auth-request.ts";
import { verifyAuthRequest } from "../handshake/verify-auth-request.ts";
import { normalizeIntent } from "../handshake/normalize-intent.ts";
import {
  BEING_KEY_MATERIAL,
} from "./fixtures/pgp-keys.ts";

const decodeIntent = (intent?: Uint8Array) =>
  intent ? new TextDecoder().decode(intent) : undefined;

describe("verifyAuthRequest", () => {
  it("returns the verified request payload", async () => {
    const intent = "intent";
    const request = await createAuthRequest(BEING_KEY_MATERIAL, { intent });

    const result = await verifyAuthRequest(request.payload);

    const intentBytes = normalizeIntent(intent);
    const expectedMessage = buildAuthMessage(
      BEING_KEY_MATERIAL.signing.publicKey,
      BEING_KEY_MATERIAL.encryption.publicKey,
      intentBytes,
    );

    assert.equal(result.signingPublicKey, BEING_KEY_MATERIAL.signing.publicKey);
    assert.equal(result.encryptionPublicKey, BEING_KEY_MATERIAL.encryption.publicKey);
    assert.equal(decodeIntent(result.intent), intent);
    assert.deepEqual(result.message, expectedMessage);
  });

  it("omits the intent when it is not supplied", async () => {
    const request = await createAuthRequest(BEING_KEY_MATERIAL);

    const result = await verifyAuthRequest(request.payload);

    assert.equal(result.intent, undefined);
    const expectedMessage = buildAuthMessage(
      BEING_KEY_MATERIAL.signing.publicKey,
      BEING_KEY_MATERIAL.encryption.publicKey,
    );
    assert.deepEqual(result.message, expectedMessage);
  });

  it("throws when signature verification fails", async () => {
    const request = await createAuthRequest(BEING_KEY_MATERIAL);

    await assert.rejects(
      verifyAuthRequest({
        signingPublicKey: BEING_KEY_MATERIAL.encryption.publicKey,
        encryptionPublicKey: request.payload.encryptionPublicKey,
        signature: request.payload.signature,
        intent: request.payload.intent,
      }),
      /Invalid authentication request signature/,
    );
  });
});
