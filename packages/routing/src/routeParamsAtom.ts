import { atom, useAtomValue, useSetAtom } from "jotai";

export type RouteParams = Record<string, string | undefined>;

const baseRouteParamsAtom = atom<RouteParams>({});

console.log("routerParamsAtomModule loaded!!");

const normalizeRouteParams = (params: RouteParams): RouteParams => {
  const normalized: RouteParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }
  return normalized;
};

const areRouteParamsEqual = (current: RouteParams, next: RouteParams): boolean => {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);
  if (currentKeys.length !== nextKeys.length) {
    return false;
  }
  for (const key of currentKeys) {
    if (current[key] !== next[key]) {
      return false;
    }
  }
  return true;
};

export const routeParamsAtom = atom(
  (get) => get(baseRouteParamsAtom),
  (get, set, params: RouteParams) => {
    const current = get(baseRouteParamsAtom);
    const next = normalizeRouteParams(params);
    if (areRouteParamsEqual(current, next)) {
      console.debug("[routing] setRouteParams skipped", { current, next });
      return;
    }
    console.debug("[routing] setRouteParams", { current, next });
    set(baseRouteParamsAtom, next);
  },
);

export const setRouteParamsAtom = atom(
  null,
  (_get, set, params: RouteParams) => {
    set(routeParamsAtom, params);
  },
);

export const useRouteParams = () => useAtomValue(routeParamsAtom);
export const useSetRouteParams = () => useSetAtom(routeParamsAtom);

export default routeParamsAtom;
