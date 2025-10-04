import * as openpgp from "openpgp";

import type { BeingKeyMaterial } from "../identities.ts";
import { readPrivateKey, readPublicKey } from "./read-keys.ts";
import { resolveArmoredString } from "./resolve-armored-string.ts";
import { buildChallengeMessageText } from "./build-challenge-message-text.ts";
import type { ChallengeResponse, IdpChallenge } from "./types.ts";

export const createChallengeResponse = async (
    challenge: IdpChallenge,
    keyMaterial: BeingKeyMaterial,
): Promise<ChallengeResponse> => {
    const message = await openpgp.readMessage({
        armoredMessage: challenge.encryptedNonce,
    });
    const decryptionKey = await readPrivateKey(keyMaterial.encryption.privateKey);
    const idpSigningKey = await readPublicKey(challenge.idpSigningPublicKey);

    const decrypted = await openpgp.decrypt({
        message,
        decryptionKeys: decryptionKey,
        expectSigned: true,
        verificationKeys: idpSigningKey,
    });

    const [signature] = decrypted.signatures ?? [];
    if (signature) {
        try {
            await signature.verified;
        } catch (error) {
            throw new Error("Unable to verify IDP challenge signature", {
                cause: error,
            });
        }
    }

    const nonceBase64 = await resolveArmoredString(decrypted.data);

    const responseMessage = await openpgp.createMessage({
        text: buildChallengeMessageText(challenge.challengeId, nonceBase64),
    });

    const signingKey = await readPrivateKey(keyMaterial.signing.privateKey);
    const signatureArmored = await resolveArmoredString(
        await openpgp.sign({
            message: responseMessage,
            signingKeys: signingKey,
            detached: true,
            format: "armored",
        }),
    );

    return {
        challengeId: challenge.challengeId,
        signature: signatureArmored,
    } satisfies ChallengeResponse;
};

export default createChallengeResponse;
