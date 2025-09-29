import * as openpgp from "openpgp";

import { toBase64 } from "../encoding.ts";
import type { BeingKeyMaterial } from "../identities.ts";
import { normalizeIntent } from "./normalize-intent.ts";
import { buildAuthMessage } from "./build-auth-message.ts";
import { resolveArmoredString } from "./resolve-armored-string.ts";
import { readPrivateKey } from "./read-keys.ts";
import type { AuthIntent, AuthRequest } from "./types.ts";

export const createAuthRequest = async (
  keyMaterial: BeingKeyMaterial,
  options: { intent?: AuthIntent } = {},
): Promise<AuthRequest> => {
  const intentBytes = normalizeIntent(options.intent);
  const messageBytes = buildAuthMessage(
    keyMaterial.signing.publicKey,
    keyMaterial.encryption.publicKey,
    intentBytes,
  );

  const message = await openpgp.createMessage({ binary: messageBytes });
  const signingKey = await readPrivateKey(keyMaterial.signing.privateKey);
  const signature = await resolveArmoredString(
    await openpgp.sign({
      message,
      signingKeys: signingKey,
      detached: true,
      format: "armored",
    }),
  );

  return {
    payload: {
      signingPublicKey: keyMaterial.signing.publicKey,
      encryptionPublicKey: keyMaterial.encryption.publicKey,
      signature,
      intent: intentBytes ? toBase64(intentBytes) : undefined,
    },
    message: toBase64(messageBytes),
  } satisfies AuthRequest;
};

export default createAuthRequest;
