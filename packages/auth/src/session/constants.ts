export const SESSION_STORAGE_KEY = "root.solar/being-session" as const;
export const PIN_LENGTH = 4;
export const RANDOM_RANGE = 65536;
export const MAX_PIN = 10 ** PIN_LENGTH;
export const ACCEPT_BOUND = Math.floor(RANDOM_RANGE / MAX_PIN) * MAX_PIN;
