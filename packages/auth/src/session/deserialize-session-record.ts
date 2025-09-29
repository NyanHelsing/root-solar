import { beingSessionSchema, type BeingSessionRecord } from "./schema.ts";

export const deserializeSessionRecord = (serialized: string): BeingSessionRecord =>
  beingSessionSchema.parse(JSON.parse(serialized));

export default deserializeSessionRecord;
