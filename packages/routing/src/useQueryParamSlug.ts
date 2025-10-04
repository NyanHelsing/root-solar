import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { atom, useAtom } from "jotai";
import type { WritableAtom } from "jotai";

import { routeQueryParamsAtom, setRouteQueryParamAtom } from "./routeQueryParamsAtom.ts";

type NormalizeFn = (value: string | null) => string | null;

type UseQueryParamSlugOptions = {
    key: string;
    defaultValue?: string | null;
    normalize?: NormalizeFn;
    replace?: boolean;
};

type UseQueryParamSlugResult = {
    value: string | null;
    setValue: (next: string | null) => void;
};

const defaultNormalize: NormalizeFn = (value) => {
    if (!value) {
        return null;
    }
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        return null;
    }
    return trimmed.startsWith("tag:") ? trimmed.slice(4) : trimmed;
};

const createQueryParamSlugAtom = (
    key: string,
    normalize: NormalizeFn,
    defaultValue: string | null | undefined
): WritableAtom<string | null, [string | null], void> =>
    atom<string | null, [string | null], void>(
        (get) => {
            const params = get(routeQueryParamsAtom);
            const raw = params[key] ?? null;
            const normalized = normalize(raw);
            const fallback = defaultValue ?? null;

            return normalized ?? fallback;
        },
        (_get, set, next) => {
            set(setRouteQueryParamAtom, { key, value: next });
        }
    );

export const useQueryParamSlug = ({
    key,
    defaultValue = null,
    normalize = defaultNormalize,
    replace = true
}: UseQueryParamSlugOptions): UseQueryParamSlugResult => {
    const slugAtom = useMemo(
        () => createQueryParamSlugAtom(key, normalize, defaultValue),
        [defaultValue, key, normalize]
    );
    const [normalizedValue, commitValue] = useAtom(slugAtom);
    const navigate = useNavigate();
    const location = useLocation();

    const setValue = useCallback(
        (next: string | null) => {
            commitValue(next);

            const searchParams = new URLSearchParams(location.search);
            if (next && next.trim().length > 0) {
                searchParams.set(key, next);
            } else {
                searchParams.delete(key);
            }

            const search = searchParams.toString();
            navigate(
                {
                    pathname: location.pathname,
                    search: search.length > 0 ? `?${search}` : undefined
                },
                { replace }
            );
        },
        [key, location.pathname, location.search, navigate, replace, commitValue]
    );

    return {
        value: normalizedValue,
        setValue
    };
};

export default useQueryParamSlug;
