import * as openpgp from "openpgp";

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export type BeingKeyMaterial = {
  signing: KeyPair;
  encryption: KeyPair;
};

const generateKeyPair = async (
  curve: "ed25519" | "curve25519",
  userName: string,
): Promise<KeyPair> => {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: "ecc",
    curve,
    userIDs: [{ name: userName }],
    format: "armored",
  });

  return { publicKey, privateKey };
};

export const generateSigningKeyPair = async (): Promise<KeyPair> =>
  generateKeyPair("ed25519", "root.solar-being-signing");

export const generateEncryptionKeyPair = async (): Promise<KeyPair> =>
  generateKeyPair("curve25519", "root.solar-being-encryption");

export const generateBeingKeyMaterial =
  async (): Promise<BeingKeyMaterial> => ({
    signing: await generateSigningKeyPair(),
    encryption: await generateEncryptionKeyPair(),
  });
