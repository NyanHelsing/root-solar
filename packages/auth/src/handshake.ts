import { randomBytes } from "node:crypto";
import * as openpgp from "openpgp";

import { fromBase64, toBase64, utf8ToBytes, concatBytes, bytesToUtf8 } from "./encoding.ts";
import type { BeingKeyMaterial, KeyPair } from "./identities.ts";
import { generateSigningKeyPair } from "./identities.ts";

export type AuthIntent = string | Uint8Array | undefined;

export type AuthRequestPayload = {
  signingPublicKey: string;
  encryptionPublicKey: string;
  signature: string;
  intent?: string;
};

export type AuthRequest = {
  payload: AuthRequestPayload;
  message: string;
};

export type VerifiedAuthRequest = {
  signingPublicKey: string;
  encryptionPublicKey: string;
  intent?: Uint8Array;
  message: Uint8Array;
};

export const AUTHENTICATION_CONTEXT = utf8ToBytes("root.solar/authentication/v1");

const normalizeIntent = (intent: AuthIntent): Uint8Array | undefined => {
  if (intent === undefined) {
    return undefined;
  }
  if (typeof intent === "string") {
    return utf8ToBytes(intent);
  }
  return intent;
};

const buildAuthMessage = (
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

const readPrivateKey = async (armoredKey: string) =>
  openpgp.readPrivateKey({ armoredKey });

const readPublicKey = async (armoredKey: string) =>
  openpgp.readKey({ armoredKey });

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
  const signature = await openpgp.sign({
    message,
    signingKeys: signingKey,
    detached: true,
    format: "armored",
  });

  return {
    payload: {
      signingPublicKey: keyMaterial.signing.publicKey,
      encryptionPublicKey: keyMaterial.encryption.publicKey,
      signature,
      intent: intentBytes ? toBase64(intentBytes) : undefined,
    },
    message: toBase64(messageBytes),
  };
};

export const verifyAuthRequest = async (
  payload: AuthRequestPayload,
): Promise<VerifiedAuthRequest> => {
  const intentBytes = payload.intent ? fromBase64(payload.intent) : undefined;
  const messageBytes = buildAuthMessage(
    payload.signingPublicKey,
    payload.encryptionPublicKey,
    intentBytes,
  );

  const message = await openpgp.createMessage({ binary: messageBytes });
  const signature = await openpgp.readSignature({ armoredSignature: payload.signature });
  const verificationKey = await readPublicKey(payload.signingPublicKey);

  const verificationResult = await openpgp.verify({
    message,
    signature,
    verificationKeys: verificationKey,
  });

  const [firstSignature] = verificationResult.signatures;
  try {
    await firstSignature.verified;
  } catch (error) {
    throw new Error("Invalid authentication request signature", { cause: error });
  }

  return {
    signingPublicKey: payload.signingPublicKey,
    encryptionPublicKey: payload.encryptionPublicKey,
    intent: intentBytes,
    message: messageBytes,
  };
};

export type IdpChallenge = {
  challengeId: string;
  encryptedNonce: string;
  idpSigningPublicKey: string;
};

export type IdpChallengeRecord = {
  challengeId: string;
  nonce: string;
  idpSigningKeyPair: KeyPair;
  beingSigningPublicKey: string;
  beingEncryptionPublicKey: string;
};

const CHALLENGE_NONCE_LENGTH = 32;
const CHALLENGE_ID_LENGTH = 16;

const buildChallengeMessageText = (challengeId: string, nonceBase64: string): string =>
  `${bytesToUtf8(AUTHENTICATION_CONTEXT)}::${challengeId}::${nonceBase64}`;

export const createIdpChallenge = async (
  request: VerifiedAuthRequest,
  options: { idpSigningKeyPair?: KeyPair; nonceLength?: number; challengeId?: string } = {},
): Promise<{ challenge: IdpChallenge; record: IdpChallengeRecord }> => {
  const idpSigningKeyPair = options.idpSigningKeyPair ?? (await generateSigningKeyPair());

  const nonceLength = options.nonceLength ?? CHALLENGE_NONCE_LENGTH;
  const nonceBytes = randomBytes(nonceLength);
  const nonceBase64 = toBase64(nonceBytes);
  const challengeId = options.challengeId ?? toBase64(randomBytes(CHALLENGE_ID_LENGTH));

  const encryptionKey = await readPublicKey(request.encryptionPublicKey);
  const signingKey = await readPrivateKey(idpSigningKeyPair.privateKey);
  const message = await openpgp.createMessage({ text: nonceBase64 });

  const encryptedNonce = await openpgp.encrypt({
    message,
    encryptionKeys: encryptionKey,
    signingKeys: signingKey,
    format: "armored",
  });

  return {
    challenge: {
      challengeId,
      encryptedNonce,
      idpSigningPublicKey: idpSigningKeyPair.publicKey,
    },
    record: {
      challengeId,
      nonce: nonceBase64,
      idpSigningKeyPair,
      beingSigningPublicKey: request.signingPublicKey,
      beingEncryptionPublicKey: request.encryptionPublicKey,
    },
  };
};

export type ChallengeResponse = {
  challengeId: string;
  signature: string;
};

export const createChallengeResponse = async (
  challenge: IdpChallenge,
  keyMaterial: BeingKeyMaterial,
): Promise<ChallengeResponse> => {
  const message = await openpgp.readMessage({ armoredMessage: challenge.encryptedNonce });
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
      throw new Error("Unable to verify IDP challenge signature", { cause: error });
    }
  }

  const nonceBase64 = typeof decrypted.data === "string" ? decrypted.data : decrypted.data.toString();

  const responseMessage = await openpgp.createMessage({
    text: buildChallengeMessageText(challenge.challengeId, nonceBase64),
  });

  const signingKey = await readPrivateKey(keyMaterial.signing.privateKey);
  const signatureArmored = await openpgp.sign({
    message: responseMessage,
    signingKeys: signingKey,
    detached: true,
    format: "armored",
  });

  return {
    challengeId: challenge.challengeId,
    signature: signatureArmored,
  };
};

export const verifyChallengeResponse = async (
  response: ChallengeResponse,
  record: IdpChallengeRecord,
): Promise<boolean> => {
  if (response.challengeId !== record.challengeId) {
    return false;
  }

  const message = await openpgp.createMessage({
    text: buildChallengeMessageText(record.challengeId, record.nonce),
  });

  const signature = await openpgp.readSignature({ armoredSignature: response.signature });
  const verificationKey = await readPublicKey(record.beingSigningPublicKey);

  try {
    const verificationResult = await openpgp.verify({
      message,
      signature,
      verificationKeys: verificationKey,
    });

    const [firstSignature] = verificationResult.signatures;
    await firstSignature.verified;
    return true;
  } catch (error) {
    return false;
  }
};
