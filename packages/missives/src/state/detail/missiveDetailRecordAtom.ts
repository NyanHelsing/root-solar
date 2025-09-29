import type { MissiveRecord } from "../../types.ts";
import { missiveDetailRecordFamily } from "./missiveDetailRecordFamily.ts";
import { emptyDetailRecordAtom } from "./emptyDetailRecordAtom.ts";

export const missiveDetailRecordAtom = (missiveId?: string) =>
  missiveId ? missiveDetailRecordFamily(missiveId) : emptyDetailRecordAtom;

export default missiveDetailRecordAtom;
