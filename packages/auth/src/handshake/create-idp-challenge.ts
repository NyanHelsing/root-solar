import * as openpgp from "openpgp";

import { toBase64 } from "../encoding.ts";
import { generateSigningKeyPair } from "../identities.ts";
import type { KeyPair } from "../identities.ts";
import { getRandomBytes } from "../random.ts";
import { CHALLENGE_ID_LENGTH, CHALLENGE_NONCE_LENGTH } from "./constants.ts";
import { readPrivateKey, readPublicKey } from "./read-keys.ts";
import { resolveArmoredString } from "./resolve-armored-string.ts";
import type { IdpChallenge, IdpChallengeRecord, VerifiedAuthRequest } from "./types.ts";

export const createIdpChallenge = async (
    request: VerifiedAuthRequest,
    options: {
        idpSigningKeyPair?: KeyPair;
        nonceLength?: number;
        challengeId?: string;
    } = {}
): Promise<{ challenge: IdpChallenge; record: IdpChallengeRecord }> => {
    const idpSigningKeyPair = options.idpSigningKeyPair ?? (await generateSigningKeyPair());

    const nonceLength = options.nonceLength ?? CHALLENGE_NONCE_LENGTH;
    const nonceBytes = getRandomBytes(nonceLength);
    const nonceBase64 = toBase64(nonceBytes);
    const challengeId = options.challengeId ?? toBase64(getRandomBytes(CHALLENGE_ID_LENGTH));

    const encryptionKey = await readPublicKey(request.encryptionPublicKey);
    const signingKey = await readPrivateKey(idpSigningKeyPair.privateKey);
    const message = await openpgp.createMessage({ text: nonceBase64 });

    const encryptedNonce = await resolveArmoredString(
        await openpgp.encrypt({
            message,
            encryptionKeys: encryptionKey,
            signingKeys: signingKey,
            format: "armored"
        })
    );

    return {
        challenge: {
            challengeId,
            encryptedNonce,
            idpSigningPublicKey: idpSigningKeyPair.publicKey
        },
        record: {
            challengeId,
            nonce: nonceBase64,
            idpSigningKeyPair,
            beingSigningPublicKey: request.signingPublicKey,
            beingEncryptionPublicKey: request.encryptionPublicKey
        }
    };
};

export default createIdpChallenge;
