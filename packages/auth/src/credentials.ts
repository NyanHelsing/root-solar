import { z } from "zod";

import { utf8ToBytes } from "./encoding.ts";
import type { BeingKeyMaterial, KeyPair } from "./identities.ts";
import {
  encryptWithPassword,
  decryptToUtf8,
  type EncryptedPayload,
} from "./crypto/password.ts";

const encryptedPayloadSchema = z.object({
  algorithm: z.literal("AES-GCM"),
  ciphertext: z.string(),
  iv: z.string(),
  salt: z.string(),
  iterations: z.number().int().positive(),
  hash: z.string(),
  keyLength: z.number().int().positive(),
});

const keyPairSchema = z.object({
  publicKey: z.string(),
  privateKey: z.string(),
});

const credentialSchema = z.object({
  version: z.literal(1),
  kind: z.literal("root.solar/being-credentials"),
  createdAt: z.string(),
  being: z.object({
    id: z.string(),
    name: z.string().optional(),
  }),
  signing: z.object({
    publicKey: z.string(),
    encryptedKeyPair: encryptedPayloadSchema,
  }),
  encryption: z.object({
    publicKey: z.string(),
    encryptedKeyPair: encryptedPayloadSchema,
  }),
});

export type BeingCredentialFile = z.infer<typeof credentialSchema>;

const credentialBundleSchema = z.object({
  beingId: z.string(),
  beingName: z.string().optional(),
  signing: keyPairSchema,
  encryption: keyPairSchema,
});

const encodeKeyPair = (keyPair: KeyPair): Uint8Array =>
  utf8ToBytes(JSON.stringify(keyPair));

const decodeKeyPair = (payload: string): KeyPair =>
  keyPairSchema.parse(JSON.parse(payload));

export type BeingCredentialBundle = {
  beingId: string;
  beingName?: string;
  signing: KeyPair;
  encryption: KeyPair;
};

const nowIsoString = (): string => new Date().toISOString();

export const createBeingCredentialFile = async (
  bundle: BeingCredentialBundle,
  password: string,
): Promise<BeingCredentialFile> => {
  const signingPayload = await encryptWithPassword(
    encodeKeyPair(bundle.signing),
    password,
  );
  const encryptionPayload = await encryptWithPassword(
    encodeKeyPair(bundle.encryption),
    password,
  );

  return {
    version: 1,
    kind: "root.solar/being-credentials",
    createdAt: nowIsoString(),
    being: {
      id: bundle.beingId,
      name: bundle.beingName,
    },
    signing: {
      publicKey: bundle.signing.publicKey,
      encryptedKeyPair: signingPayload,
    },
    encryption: {
      publicKey: bundle.encryption.publicKey,
      encryptedKeyPair: encryptionPayload,
    },
  } satisfies BeingCredentialFile;
};

export const createBeingCredentialBundle = (
  being: { id: string; name?: string },
  keyMaterial: BeingKeyMaterial,
): BeingCredentialBundle => ({
  beingId: being.id,
  beingName: being.name,
  signing: keyMaterial.signing,
  encryption: keyMaterial.encryption,
});

export const parseBeingCredentialFile = (
  input: unknown,
): BeingCredentialFile => credentialSchema.parse(input);

export const parseBeingCredentialBundle = (
  input: unknown,
): BeingCredentialBundle => credentialBundleSchema.parse(input);

export const deserializeBeingCredentialFile = (
  serialized: string,
): BeingCredentialFile => parseBeingCredentialFile(JSON.parse(serialized));

export const decryptBeingCredentialFile = async (
  credentialFile: BeingCredentialFile,
  password: string,
): Promise<BeingCredentialBundle> => ({
  beingId: credentialFile.being.id,
  beingName: credentialFile.being.name,
  signing: decodeKeyPair(
    await decryptToUtf8(credentialFile.signing.encryptedKeyPair, password),
  ),
  encryption: decodeKeyPair(
    await decryptToUtf8(credentialFile.encryption.encryptedKeyPair, password),
  ),
});

export const serializeBeingCredentialFile = (
  credentialFile: BeingCredentialFile,
  spacing = 2,
): string => JSON.stringify(credentialFile, null, spacing);

export const credentialBundleToKeyMaterial = (
  bundle: BeingCredentialBundle,
): BeingKeyMaterial => ({
  signing: bundle.signing,
  encryption: bundle.encryption,
});

export const credentialFileToDataUrl = (
  credentialFile: BeingCredentialFile,
): string => {
  const serialized = serializeBeingCredentialFile(credentialFile);
  const encoded = encodeURIComponent(serialized);
  return `data:application/json;charset=utf-8,${encoded}`;
};

export const readFileAsText = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Unexpected file reader result type"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read credential file"));
    };
    reader.readAsText(file);
  });
