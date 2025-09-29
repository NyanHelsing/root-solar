import type { BeingSessionRecord } from "./schema.ts";

export const serializeSessionRecord = (record: BeingSessionRecord): string =>
  JSON.stringify(record);

export default serializeSessionRecord;
