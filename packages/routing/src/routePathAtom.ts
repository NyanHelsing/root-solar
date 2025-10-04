import { atom, useAtomValue, useSetAtom } from "jotai";

const baseRoutePathAtom = atom<string>("/");

export const routePathAtom = atom(
    (get) => get(baseRoutePathAtom),
    (get, set, next: string) => {
        const current = get(baseRoutePathAtom);
        if (current === next) {
            console.debug("[routing] routePathAtom skipped", { current, next });
            return;
        }
        console.debug("[routing] routePathAtom update", { current, next });
        set(baseRoutePathAtom, next);
    }
);

export const useRoutePath = () => useAtomValue(routePathAtom);
export const useSetRoutePath = () => useSetAtom(routePathAtom);

export default routePathAtom;
