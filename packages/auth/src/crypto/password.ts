import { utf8ToBytes, bytesToUtf8, toBase64, fromBase64 } from "../encoding.ts";
import { getRandomBytes } from "../random.ts";
import { getSubtleCrypto } from "./webcrypto.ts";

type PasswordKeyDerivationParams = {
  iterations: number;
  hash: string;
  keyLength: number;
};

const DEFAULT_PARAMS: PasswordKeyDerivationParams = {
  iterations: 200_000,
  hash: "SHA-256",
  keyLength: 256,
};

const AES_GCM_IV_LENGTH = 12;
const SALT_LENGTH = 16;

const importPasswordKey = async (password: string) => {
  const subtle = getSubtleCrypto();
  return subtle.importKey(
    "raw",
    utf8ToBytes(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
};

const deriveEncryptionKey = async (
  passwordKey: CryptoKey,
  salt: Uint8Array,
  params: PasswordKeyDerivationParams,
) => {
  const subtle = getSubtleCrypto();
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: params.iterations,
      hash: params.hash,
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: params.keyLength,
    },
    false,
    ["encrypt", "decrypt"],
  );
};

const arrayBufferToUint8Array = (buffer: ArrayBuffer): Uint8Array =>
  new Uint8Array(buffer);

export type EncryptedPayload = {
  algorithm: "AES-GCM";
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
  hash: string;
  keyLength: number;
};

const ensureUint8Array = (input: Uint8Array | string): Uint8Array => {
  if (typeof input === "string") {
    return utf8ToBytes(input);
  }
  return input;
};

export const encryptWithPassword = async (
  plaintext: Uint8Array | string,
  password: string,
  options: Partial<PasswordKeyDerivationParams> = {},
): Promise<EncryptedPayload> => {
  const params = { ...DEFAULT_PARAMS, ...options } satisfies PasswordKeyDerivationParams;
  const salt = getRandomBytes(SALT_LENGTH);
  const iv = getRandomBytes(AES_GCM_IV_LENGTH);
  const passwordKey = await importPasswordKey(password);
  const encryptionKey = await deriveEncryptionKey(passwordKey, salt, params);
  const subtle = getSubtleCrypto();
  const ciphertextBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    ensureUint8Array(plaintext),
  );
  const ciphertext = toBase64(arrayBufferToUint8Array(ciphertextBuffer));

  return {
    algorithm: "AES-GCM",
    ciphertext,
    iv: toBase64(iv),
    salt: toBase64(salt),
    iterations: params.iterations,
    hash: params.hash,
    keyLength: params.keyLength,
  };
};

export const decryptWithPassword = async (
  payload: EncryptedPayload,
  password: string,
): Promise<Uint8Array> => {
  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);
  const params: PasswordKeyDerivationParams = {
    iterations: payload.iterations,
    hash: payload.hash,
    keyLength: payload.keyLength,
  };
  const passwordKey = await importPasswordKey(password);
  const encryptionKey = await deriveEncryptionKey(passwordKey, salt, params);
  const subtle = getSubtleCrypto();
  const plaintextBuffer = await subtle.decrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    ciphertext,
  );
  return arrayBufferToUint8Array(plaintextBuffer);
};

export const decryptToUtf8 = async (
  payload: EncryptedPayload,
  password: string,
): Promise<string> => bytesToUtf8(await decryptWithPassword(payload, password));
