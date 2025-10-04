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
} from "./handshake/index.ts";

export {
    createAuthRequest,
    verifyAuthRequest,
    createIdpChallenge,
    createChallengeResponse,
    verifyChallengeResponse,
    AUTHENTICATION_CONTEXT,
} from "./handshake/index.ts";

export {
    toBase64,
    fromBase64,
    utf8ToBytes,
    bytesToUtf8,
} from "./encoding.ts";

export {
    createBeingSession,
    loadBeingSessionRecord,
    persistBeingSessionRecord,
    clearBeingSessionRecord,
    unlockBeingSessionRecord,
    generateSessionPin,
    getSessionStorageKey,
    type BeingSessionRecord,
} from "./session.ts";

export {
    beingSessionAtom,
    beingSessionSummaryAtom,
    type BeingSessionAction,
} from "./session-atoms.ts";

export {
    beingAtom,
    useBeing,
    type Being,
} from "./beings.ts";
