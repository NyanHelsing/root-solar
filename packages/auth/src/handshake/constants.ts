import { utf8ToBytes } from "../encoding.ts";

export const AUTHENTICATION_CONTEXT = utf8ToBytes(
  "root.solar/authentication/v1",
);

export const CHALLENGE_NONCE_LENGTH = 32;
export const CHALLENGE_ID_LENGTH = 16;
