import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as openpgp from "openpgp";

import { buildChallengeMessageText } from "../handshake/build-challenge-message-text.ts";
import { verifyChallengeResponse } from "../handshake/verify-challenge-response.ts";
import {
  BEING_SIGNING_PRIVATE_KEY,
  BEING_SIGNING_PUBLIC_KEY,
} from "./fixtures/pgp-keys.ts";

const createSignedChallengeResponse = async (challengeId: string, nonceBase64: string) => {
  const message = await openpgp.createMessage({
    text: buildChallengeMessageText(challengeId, nonceBase64),
  });
  const signingKey = await openpgp.readPrivateKey({ armoredKey: BEING_SIGNING_PRIVATE_KEY });
  return await openpgp.sign({
    message,
    detached: true,
    signingKeys: signingKey,
    format: "armored",
  });
};

describe("verifyChallengeResponse", () => {
  it("returns true for matching signatures", async () => {
    const challengeId = "challenge-1";
    const nonceBase64 = Buffer.from("nonce-value").toString("base64");
    const signature = await createSignedChallengeResponse(challengeId, nonceBase64);

    const result = await verifyChallengeResponse(
      {
        challengeId,
        signature,
      },
      {
        challengeId,
        nonce: nonceBase64,
        idpSigningKeyPair: { publicKey: "idp", privateKey: "idp" },
        beingSigningPublicKey: BEING_SIGNING_PUBLIC_KEY,
        beingEncryptionPublicKey: "enc",
      },
    );

    assert.equal(result, true);
  });

  it("returns false when OpenPGP verification fails", async () => {
    const challengeId = "challenge-1";
    const nonceBase64 = Buffer.from("nonce-value").toString("base64");

    const result = await verifyChallengeResponse(
      {
        challengeId,
        signature: "invalid-signature",
      },
      {
        challengeId,
        nonce: nonceBase64,
        idpSigningKeyPair: { publicKey: "idp", privateKey: "idp" },
        beingSigningPublicKey: BEING_SIGNING_PUBLIC_KEY,
        beingEncryptionPublicKey: "enc",
      },
    );

    assert.equal(result, false);
  });

  it("returns false when challenge identifiers differ", async () => {
    const nonceBase64 = Buffer.from("nonce-value").toString("base64");
    const signature = await createSignedChallengeResponse("challenge-1", nonceBase64);

    const result = await verifyChallengeResponse(
      {
        challengeId: "other",
        signature,
      },
      {
        challengeId: "challenge-1",
        nonce: nonceBase64,
        idpSigningKeyPair: { publicKey: "idp", privateKey: "idp" },
        beingSigningPublicKey: BEING_SIGNING_PUBLIC_KEY,
        beingEncryptionPublicKey: "enc",
      },
    );

    assert.equal(result, false);
  });
});
