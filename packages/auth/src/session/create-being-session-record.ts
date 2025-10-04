import { encryptWithPassword } from "../crypto/password.ts";
import type { BeingCredentialBundle } from "../credentials.ts";
import { encodeBundle } from "./encode-bundle.ts";
import { nowIsoString } from "./now-iso-string.ts";
import type { BeingSessionRecord } from "./schema.ts";

export const createBeingSessionRecord = async (
    bundle: BeingCredentialBundle,
    pin: string,
): Promise<BeingSessionRecord> => {
    const encryptedBundle = await encryptWithPassword(encodeBundle(bundle), pin);
    return {
        version: 1,
        createdAt: nowIsoString(),
        being: {
            id: bundle.beingId,
            name: bundle.beingName,
            signingPublicKey: bundle.signing.publicKey,
            encryptionPublicKey: bundle.encryption.publicKey,
        },
        encryptedBundle,
    } satisfies BeingSessionRecord;
};

export default createBeingSessionRecord;
