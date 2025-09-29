import { atom } from "jotai";

import type { MissiveRecord } from "../../types.ts";

export const emptyDetailRecordAtom = atom<MissiveRecord | null>(null);

export default emptyDetailRecordAtom;
