import * as openpgp from "openpgp";

export const readPrivateKey = async (armoredKey: string) =>
  openpgp.readPrivateKey({ armoredKey });

export const readPublicKey = async (armoredKey: string) =>
  openpgp.readKey({ armoredKey });

export default {
  readPrivateKey,
  readPublicKey,
};
