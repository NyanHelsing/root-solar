import type { BeingKeyMaterial, KeyPair } from "../identities.ts";

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

export type ChallengeResponse = {
    challengeId: string;
    signature: string;
};

export type { BeingKeyMaterial, KeyPair };
