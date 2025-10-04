import * as openpgp from "openpgp";

import { fromBase64 } from "../encoding.ts";
import { buildAuthMessage } from "./build-auth-message.ts";
import { readPublicKey } from "./read-keys.ts";
import type { AuthRequestPayload, VerifiedAuthRequest } from "./types.ts";

export const verifyAuthRequest = async (
    payload: AuthRequestPayload
): Promise<VerifiedAuthRequest> => {
    const intentBytes = payload.intent ? fromBase64(payload.intent) : undefined;
    const messageBytes = buildAuthMessage(
        payload.signingPublicKey,
        payload.encryptionPublicKey,
        intentBytes
    );

    const message = await openpgp.createMessage({ binary: messageBytes });
    const signature = await openpgp.readSignature({
        armoredSignature: payload.signature
    });
    const verificationKey = await readPublicKey(payload.signingPublicKey);

    const verificationResult = await openpgp.verify({
        message,
        signature,
        verificationKeys: verificationKey
    });

    const [firstSignature] = verificationResult.signatures;
    try {
        await firstSignature.verified;
    } catch (error) {
        throw new Error("Invalid authentication request signature", {
            cause: error
        });
    }

    return {
        signingPublicKey: payload.signingPublicKey,
        encryptionPublicKey: payload.encryptionPublicKey,
        intent: intentBytes,
        message: messageBytes
    } satisfies VerifiedAuthRequest;
};

export default verifyAuthRequest;
