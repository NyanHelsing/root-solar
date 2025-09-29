import * as openpgp from "openpgp";

import { readPublicKey } from "./read-keys.ts";
import { buildChallengeMessageText } from "./build-challenge-message-text.ts";
import type { ChallengeResponse, IdpChallengeRecord } from "./types.ts";

export const verifyChallengeResponse = async (
  response: ChallengeResponse,
  record: IdpChallengeRecord,
): Promise<boolean> => {
  if (response.challengeId !== record.challengeId) {
    return false;
  }

  const message = await openpgp.createMessage({
    text: buildChallengeMessageText(record.challengeId, record.nonce),
  });

  let signature;
  try {
    signature = await openpgp.readSignature({
      armoredSignature: response.signature,
    });
  } catch {
    return false;
  }
  const verificationKey = await readPublicKey(record.beingSigningPublicKey);

  let verificationResult;
  try {
    verificationResult = await openpgp.verify({
      message,
      signature,
      verificationKeys: verificationKey,
    });
  } catch {
    return false;
  }

  const [firstSignature] = verificationResult.signatures;
  if (!firstSignature) {
    return false;
  }

  try {
    await firstSignature.verified;
    return true;
  } catch {
    return false;
  }
};

export default verifyChallengeResponse;
