import { atom, useAtomValue } from "jotai";

import { routeParamsAtom, routePathAtom } from "@root-solar/routing";

const CREATION_SEGMENT = "new" as const;

const extractMissiveIdFromPath = (path: string): string | null => {
    const match = path.match(/^(?:\/missives|\/axioms)\/([^/?#]+)/i);
    if (!match) {
        return null;
    }
    try {
        return decodeURIComponent(match[1] ?? "");
    } catch {
        return match[1] ?? null;
    }
};

export const activeMissiveIdAtom = atom<string | null>((get) => {
    const params = get(routeParamsAtom);
    const path = get(routePathAtom);
    const rawId = params.missiveId ?? extractMissiveIdFromPath(path);
    const resolved = rawId && rawId.toLowerCase() === CREATION_SEGMENT ? null : rawId;
    console.debug("[missives] activeMissiveIdAtom", {
        params,
        path,
        resolved,
    });
    return resolved;
});

export default activeMissiveIdAtom;

export const useActiveMissiveId = () => useAtomValue(activeMissiveIdAtom);
