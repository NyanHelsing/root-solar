import { z } from "zod";

import {
  type AuthRequest,
  type AuthRequestPayload,
  type ChallengeResponse,
  type IdpChallenge,
  type IdpChallengeRecord,
  type VerifiedAuthRequest,
  createIdpChallenge,
  verifyAuthRequest,
  verifyChallengeResponse,
} from "../handshake/index.ts";
import { toBase64 } from "../encoding.ts";

export const authRequestPayloadSchema = z.object({
  signingPublicKey: z.string().min(1, "Signing key is required"),
  encryptionPublicKey: z.string().min(1, "Encryption key is required"),
  signature: z.string().min(1, "Signature is required"),
  intent: z.string().min(1).optional(),
});

export const authRequestSchema = z.object({
  payload: authRequestPayloadSchema,
  message: z.string().min(1, "Request message is required"),
});

export type BeingRegistrationStartInput = {
  name: string;
  request: AuthRequest;
};

export const beingRegistrationStartInputSchema = z.object({
  name: z.string().min(3, "Name must be at least three characters"),
  request: authRequestSchema,
});

export type BeingRegistrationStartOutput = {
  challenge: IdpChallenge;
};

export type BeingRegistrationProfile = {
  id: string;
  name: string;
  signingPublicKey?: string;
  encryptionPublicKey?: string;
  intentBase64?: string;
  messageBase64?: string;
};

export type BeingRegistrationChallengeRecord = IdpChallengeRecord & {
  beingName: string;
  createdAt: string;
  intentBase64?: string;
  messageBase64: string;
};

export type BeingRegistrationStore = {
  persistChallenge: (record: BeingRegistrationChallengeRecord) => Promise<void>;
  loadChallenge: (challengeId: string) => Promise<BeingRegistrationChallengeRecord | null>;
  completeChallenge: (challengeId: string) => Promise<void>;
};

export type BeingRegistrationCompleteInput = {
  response: ChallengeResponse;
};

export const beingRegistrationCompleteInputSchema = z.object({
  response: z.object({
    challengeId: z.string().min(1, "Response challenge ID is required"),
    signature: z.string().min(1, "Challenge response signature is required"),
  }),
});

export type BeingRegistrationCompleteOutput<BeingRecord extends BeingRegistrationProfile> = {
  being: BeingRecord;
};

export type BeingRegistrationDependencies<
  BeingRecord extends BeingRegistrationProfile,
> = {
  store: BeingRegistrationStore;
  upsertBeing: (input: {
    name: string;
    signingPublicKey: string;
    encryptionPublicKey: string;
    intentBase64?: string;
    messageBase64: string;
  }) => Promise<BeingRecord>;
};

const encodeIntent = (verified: VerifiedAuthRequest) =>
  verified.intent ? toBase64(verified.intent) : undefined;

const toChallengeRecord = (
  verified: VerifiedAuthRequest,
  persistable: IdpChallengeRecord,
  beingName: string,
  messageBase64: string,
): BeingRegistrationChallengeRecord => ({
  ...persistable,
  beingName,
  createdAt: new Date().toISOString(),
  intentBase64: encodeIntent(verified),
  messageBase64,
});

export const createBeingRegistrationHandlers = <
  BeingRecord extends BeingRegistrationProfile,
>(
  deps: BeingRegistrationDependencies<BeingRecord>,
) => {
  const start = async (
    input: BeingRegistrationStartInput,
  ): Promise<BeingRegistrationStartOutput> => {
    const verified = await verifyAuthRequest(input.request.payload);

    const messageBase64 = toBase64(verified.message);
    if (messageBase64 !== input.request.message) {
      throw new Error("Auth request message does not match reconstructed payload");
    }

    const { challenge, record } = await createIdpChallenge(verified);

    await deps.store.persistChallenge(
      toChallengeRecord(verified, record, input.name, messageBase64),
    );

    return { challenge } satisfies BeingRegistrationStartOutput;
  };

  const complete = async (
    input: BeingRegistrationCompleteInput,
  ): Promise<BeingRegistrationCompleteOutput<BeingRecord>> => {
    const stored = await deps.store.loadChallenge(input.response.challengeId);
    if (!stored) {
      throw new Error(`Auth challenge ${input.response.challengeId} not found`);
    }

    const isValid = await verifyChallengeResponse(input.response, stored);
    if (!isValid) {
      throw new Error("Challenge response verification failed");
    }

    const being = await deps.upsertBeing({
      name: stored.beingName,
      signingPublicKey: stored.beingSigningPublicKey,
      encryptionPublicKey: stored.beingEncryptionPublicKey,
      intentBase64: stored.intentBase64,
      messageBase64: stored.messageBase64,
    });

    await deps.store.completeChallenge(input.response.challengeId);

    return { being } satisfies BeingRegistrationCompleteOutput<BeingRecord>;
  };

  return { start, complete };
};

export type BeingRegistrationHandlers<
  BeingRecord extends BeingRegistrationProfile,
> = ReturnType<typeof createBeingRegistrationHandlers<BeingRecord>>;
