import { decryptToUtf8 } from "../crypto/password.ts";
import { parseBeingCredentialBundle, type BeingCredentialBundle } from "../credentials.ts";
import type { BeingSessionRecord } from "./schema.ts";

export const unlockBeingSessionRecord = async (
  record: BeingSessionRecord,
  pin: string,
): Promise<BeingCredentialBundle> => {
  const serialized = await decryptToUtf8(record.encryptedBundle, pin);
  return parseBeingCredentialBundle(JSON.parse(serialized));
};

export default unlockBeingSessionRecord;
