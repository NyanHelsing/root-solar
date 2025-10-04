import assert from "node:assert/strict";
import { describe, it } from "node:test";

import * as openpgp from "openpgp";

import { createAuthRequest } from "../handshake/create-auth-request.ts";
import { createIdpChallenge } from "../handshake/create-idp-challenge.ts";
import { verifyAuthRequest } from "../handshake/verify-auth-request.ts";
import { BEING_KEY_MATERIAL, IDP_SIGNING_KEY_PAIR } from "./fixtures/pgp-keys.ts";

const createVerifiedAuthRequest = async () => {
    const request = await createAuthRequest(BEING_KEY_MATERIAL);
    return await verifyAuthRequest(request.payload);
};

describe("createIdpChallenge", () => {
    it("creates a challenge using a generated signing key pair", async () => {
        const verifiedRequest = await createVerifiedAuthRequest();
        const { challenge, record } = await createIdpChallenge(verifiedRequest);

        assert.equal(challenge.idpSigningPublicKey, record.idpSigningKeyPair?.publicKey);
        assert.equal(record.beingSigningPublicKey, BEING_KEY_MATERIAL.signing.publicKey);
        assert.equal(record.beingEncryptionPublicKey, BEING_KEY_MATERIAL.encryption.publicKey);
        assert.ok(record.idpSigningKeyPair?.privateKey.length > 0);

        const decryptedNonce = await decryptNonce(challenge);
        assert.equal(decryptedNonce, record.nonce);
    });

    it("supports provided key pairs and identifiers", async () => {
        const verifiedRequest = await createVerifiedAuthRequest();
        const options = {
            idpSigningKeyPair: IDP_SIGNING_KEY_PAIR,
            nonceLength: 4,
            challengeId: "custom-challenge"
        } as const;

        const { challenge, record } = await createIdpChallenge(verifiedRequest, options);

        assert.equal(challenge.challengeId, "custom-challenge");
        assert.equal(challenge.idpSigningPublicKey, IDP_SIGNING_KEY_PAIR.publicKey);
        assert.equal(record.idpSigningKeyPair?.publicKey, IDP_SIGNING_KEY_PAIR.publicKey);
        assert.equal(Buffer.from(record.nonce, "base64").length, options.nonceLength);
    });
});

const decryptNonce = async (challenge: { encryptedNonce: string; idpSigningPublicKey: string }) => {
    const message = await openpgp.readMessage({ armoredMessage: challenge.encryptedNonce });
    const decrypted = await openpgp.decrypt({
        message,
        decryptionKeys: await openpgp.readPrivateKey({
            armoredKey: BEING_KEY_MATERIAL.encryption.privateKey
        }),
        verificationKeys: await openpgp.readKey({ armoredKey: challenge.idpSigningPublicKey })
    });

    const data = decrypted.data;
    if (typeof data === "string") {
        return data;
    }
    if (data instanceof Uint8Array) {
        return Buffer.from(data).toString();
    }
    throw new Error("Unexpected decrypted data type");
};
