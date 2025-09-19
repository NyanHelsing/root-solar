export type {
  BeingKeyMaterial,
  KeyPair,
} from "./identities.ts";

export {
  generateBeingKeyMaterial,
  generateEncryptionKeyPair,
  generateSigningKeyPair,
} from "./identities.ts";

export type {
  AuthIntent,
  AuthRequest,
  AuthRequestPayload,
  VerifiedAuthRequest,
  IdpChallenge,
  IdpChallengeRecord,
  ChallengeResponse,
} from "./handshake.ts";

export {
  createAuthRequest,
  verifyAuthRequest,
  createIdpChallenge,
  createChallengeResponse,
  verifyChallengeResponse,
  AUTHENTICATION_CONTEXT,
} from "./handshake.ts";

export {
  toBase64,
  fromBase64,
  utf8ToBytes,
  bytesToUtf8,
} from "./encoding.ts";
