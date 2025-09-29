import { atom, useAtomValue, useSetAtom } from "jotai";

export type RouteQueryParams = Record<string, string | undefined>;

export const routeQueryParamsAtom = atom<RouteQueryParams>({});

export const setRouteQueryParamsAtom = atom(
  null,
  (_get, set, params: RouteQueryParams) => {
    set(routeQueryParamsAtom, params);
  },
);

type RouteQueryParamUpdate = {
  key: string;
  value: string | null | undefined;
};

const resolveQueryParamValue = (
  value: string | null | undefined,
): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim().length > 0 ? value : undefined;
};

const applyQueryParamUpdate = (
  current: RouteQueryParams,
  key: string,
  value: string | undefined,
): RouteQueryParams => {
  if (value === undefined) {
    if (!(key in current)) {
      return current;
    }

    const { [key]: _omitted, ...rest } = current;
    return rest;
  }

  if (current[key] === value) {
    return current;
  }

  return {
    ...current,
    [key]: value,
  };
};

export const setRouteQueryParamAtom = atom(
  null,
  (get, set, { key, value }: RouteQueryParamUpdate) => {
    const current = get(routeQueryParamsAtom);
    const resolved = resolveQueryParamValue(value);
    const next = applyQueryParamUpdate(current, key, resolved);

    if (next === current) {
      return;
    }

    set(routeQueryParamsAtom, next);
  },
);

export const useRouteQueryParams = () => useAtomValue(routeQueryParamsAtom);
export const useSetRouteQueryParams = () => useSetAtom(setRouteQueryParamsAtom);
export const useSetRouteQueryParam = () => useSetAtom(setRouteQueryParamAtom);

export default routeQueryParamsAtom;
