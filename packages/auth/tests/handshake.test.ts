import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as openpgp from "openpgp/lightweight";

import {
  createAuthRequest,
  createChallengeResponse,
  createIdpChallenge,
  generateBeingKeyMaterial,
  verifyAuthRequest,
  verifyChallengeResponse,
} from "../src/index.ts";

describe("identity handshake", () => {
  it("performs end-to-end challenge flow", async () => {
    const beingKeys = await generateBeingKeyMaterial();

    const authRequest = await createAuthRequest(beingKeys, {
      intent: "register-being",
    });

    const verifiedRequest = await verifyAuthRequest(authRequest.payload);

    const { challenge, record } = await createIdpChallenge(verifiedRequest);

    const response = await createChallengeResponse(challenge, beingKeys);

    const isValid = await verifyChallengeResponse(response, record);

    assert.equal(isValid, true);
  });

  it("rejects tampered responses", async () => {
    const beingKeys = await generateBeingKeyMaterial();
    const authRequest = await createAuthRequest(beingKeys);
    const verifiedRequest = await verifyAuthRequest(authRequest.payload);
    const { challenge, record } = await createIdpChallenge(verifiedRequest);

    const response = await createChallengeResponse(challenge, beingKeys);

    const tamperedMessage = await openpgp.createMessage({ text: "tampered" });
    const signingKey = await openpgp.readPrivateKey({ armoredKey: beingKeys.signing.privateKey });
    const tamperedSignature = await openpgp.sign({
      message: tamperedMessage,
      signingKeys: signingKey,
      detached: true,
      format: "armored",
    });

    const isValid = await verifyChallengeResponse(
      { challengeId: response.challengeId, signature: tamperedSignature },
      record,
    );

    assert.equal(isValid, false);
  });
});
