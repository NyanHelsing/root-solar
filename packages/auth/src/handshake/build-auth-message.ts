import { concatBytes, utf8ToBytes } from "../encoding.ts";
import { AUTHENTICATION_CONTEXT } from "./constants.ts";

export const buildAuthMessage = (
  signingPublicKey: string,
  encryptionPublicKey: string,
  intentBytes?: Uint8Array,
): Uint8Array => {
  const intentSegment = intentBytes ?? new Uint8Array();
  return concatBytes(
    AUTHENTICATION_CONTEXT,
    utf8ToBytes(signingPublicKey),
    utf8ToBytes(encryptionPublicKey),
    intentSegment,
  );
};

export default buildAuthMessage;
