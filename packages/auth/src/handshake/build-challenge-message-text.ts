import { bytesToUtf8 } from "../encoding.ts";
import { AUTHENTICATION_CONTEXT } from "./constants.ts";

export const buildChallengeMessageText = (
  challengeId: string,
  nonceBase64: string,
): string => `${bytesToUtf8(AUTHENTICATION_CONTEXT)}::${challengeId}::${nonceBase64}`;

export default buildChallengeMessageText;
