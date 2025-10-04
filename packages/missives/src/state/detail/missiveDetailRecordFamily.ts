import { atom } from "jotai";

import withDerivedFields from "../../utils/withDerivedFields.ts";
import type { MissiveRecord } from "../../types.ts";
import { detailQueryAtomFactory } from "./detailQueryAtomFactory.ts";

export const missiveDetailRecordFamily = (missiveId: string) =>
    atom((get): MissiveRecord | null => {
        const detailAtom = detailQueryAtomFactory(missiveId);
        const detail = get(detailAtom);
        if (!detail) {
            return null;
        }
        return withDerivedFields(detail);
    });

export default missiveDetailRecordFamily;
