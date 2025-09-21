import { z } from "zod";

import { encryptWithPassword, decryptToUtf8 } from "./crypto/password.ts";
import {
  parseBeingCredentialBundle,
  type BeingCredentialBundle,
} from "./credentials.ts";
import { getRandomBytes } from "./random.ts";

const SESSION_STORAGE_KEY = "root.solar/being-session";
const PIN_LENGTH = 4;
const MAX_PIN = 10 ** PIN_LENGTH;
const RANDOM_RANGE = 65536;
const ACCEPT_BOUND = Math.floor(RANDOM_RANGE / MAX_PIN) * MAX_PIN;

const encryptedPayloadSchema = z.object({
  algorithm: z.literal("AES-GCM"),
  ciphertext: z.string(),
  iv: z.string(),
  salt: z.string(),
  iterations: z.number().int().positive(),
  hash: z.string(),
  keyLength: z.number().int().positive(),
});

const beingSessionSchema = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  being: z.object({
    id: z.string(),
    name: z.string().optional(),
    signingPublicKey: z.string(),
    encryptionPublicKey: z.string(),
  }),
  encryptedBundle: encryptedPayloadSchema,
});

export type BeingSessionRecord = z.infer<typeof beingSessionSchema>;

const isBrowserEnvironment = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const getLocalStorage = (): Storage => {
  if (!isBrowserEnvironment()) {
    throw new Error("Session storage requires a browser environment");
  }
  return window.localStorage;
};

const nowIsoString = (): string => new Date().toISOString();

const serializeSessionRecord = (record: BeingSessionRecord): string =>
  JSON.stringify(record);

const deserializeSessionRecord = (serialized: string): BeingSessionRecord =>
  beingSessionSchema.parse(JSON.parse(serialized));

export const generateSessionPin = (): string => {
  let value = ACCEPT_BOUND;
  while (value >= ACCEPT_BOUND) {
    const random = getRandomBytes(2);
    value = (random[0] << 8) | random[1];
  }
  const pin = value % MAX_PIN;
  return pin.toString().padStart(PIN_LENGTH, "0");
};

const encodeBundle = (bundle: BeingCredentialBundle): string =>
  JSON.stringify(bundle);

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

export const persistBeingSessionRecord = (record: BeingSessionRecord): void => {
  try {
    const storage = getLocalStorage();
    storage.setItem(SESSION_STORAGE_KEY, serializeSessionRecord(record));
  } catch (error) {
    throw new Error("Failed to persist session to local storage", {
      cause: error instanceof Error ? error : undefined,
    });
  }
};

export const loadBeingSessionRecord = (): BeingSessionRecord | null => {
  if (!isBrowserEnvironment()) {
    return null;
  }
  try {
    const storage = window.localStorage;
    const serialized = storage.getItem(SESSION_STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    return deserializeSessionRecord(serialized);
  } catch (error) {
    console.warn("Failed to load stored session", error);
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (removalError) {
      console.warn("Failed to clear invalid session data", removalError);
    }
    return null;
  }
};

export const clearBeingSessionRecord = (): void => {
  if (!isBrowserEnvironment()) {
    return;
  }
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear session", error);
  }
};

export const unlockBeingSessionRecord = async (
  record: BeingSessionRecord,
  pin: string,
): Promise<BeingCredentialBundle> => {
  const serialized = await decryptToUtf8(record.encryptedBundle, pin);
  return parseBeingCredentialBundle(JSON.parse(serialized));
};

export const createBeingSession = async (
  bundle: BeingCredentialBundle,
): Promise<{ pin: string; record: BeingSessionRecord }> => {
  const pin = generateSessionPin();
  const record = await createBeingSessionRecord(bundle, pin);
  persistBeingSessionRecord(record);
  return { pin, record };
};

export const getSessionStorageKey = (): string => SESSION_STORAGE_KEY;
