import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createAuthRequest } from "../handshake/create-auth-request.ts";
import { createChallengeResponse } from "../handshake/create-challenge-response.ts";
import { createIdpChallenge } from "../handshake/create-idp-challenge.ts";
import { verifyAuthRequest } from "../handshake/verify-auth-request.ts";
import { verifyChallengeResponse } from "../handshake/verify-challenge-response.ts";
import { BEING_KEY_MATERIAL, IDP_SIGNING_KEY_PAIR } from "./fixtures/pgp-keys.ts";

const createVerifiedAuthRequest = async () => {
    const request = await createAuthRequest(BEING_KEY_MATERIAL, {
        intent: "coordinate"
    });
    return await verifyAuthRequest(request.payload);
};

describe("createChallengeResponse", () => {
    it("creates a challenge response for a valid challenge", async () => {
        const verifiedRequest = await createVerifiedAuthRequest();
        const { challenge, record } = await createIdpChallenge(verifiedRequest, {
            idpSigningKeyPair: IDP_SIGNING_KEY_PAIR
        });

        const response = await createChallengeResponse(challenge, BEING_KEY_MATERIAL);

        assert.equal(response.challengeId, challenge.challengeId);
        assert.equal(typeof response.signature, "string");

        const verified = await verifyChallengeResponse(response, record);
        assert.equal(verified, true);
    });

    it("throws when the IDP signature cannot be verified", async () => {
        const verifiedRequest = await createVerifiedAuthRequest();
        const { challenge } = await createIdpChallenge(verifiedRequest, {
            idpSigningKeyPair: IDP_SIGNING_KEY_PAIR
        });

        await assert.rejects(
            createChallengeResponse(
                {
                    ...challenge,
                    idpSigningPublicKey: BEING_KEY_MATERIAL.signing.publicKey
                },
                BEING_KEY_MATERIAL
            ),
            /(Unable to verify IDP challenge signature|Could not find signing key)/
        );
    });
});
