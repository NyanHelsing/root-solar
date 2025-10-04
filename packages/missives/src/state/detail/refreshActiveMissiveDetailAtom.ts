import { atom, useSetAtom } from "jotai";

import { activeMissiveIdAtom } from "./activeMissiveIdAtom.ts";
import { loadMissiveDetailAtom } from "./loadMissiveDetailAtom.ts";

export const refreshActiveMissiveDetailAtom = atom(null, async (get, set) => {
    const missiveId = get(activeMissiveIdAtom);
    if (!missiveId) {
        return;
    }
    await set(loadMissiveDetailAtom, missiveId);
});

export default refreshActiveMissiveDetailAtom;

export const useRefreshActiveMissiveDetail = () => useSetAtom(refreshActiveMissiveDetailAtom);
