import { useEffect } from "react";
import { useLocation, useParams, useSearchParams } from "react-router";

import { useSetRouteParams } from "./routeParamsAtom.ts";
import { useSetRoutePath } from "./routePathAtom.ts";
import { useSetRouteQueryParams } from "./routeQueryParamsAtom.ts";
import type { RouteQueryParams } from "./routeQueryParamsAtom.ts";

type RouteParamValues = Record<string, string | undefined>;

const toQueryParamsRecord = (searchParams: URLSearchParams): RouteQueryParams =>
    Object.fromEntries(searchParams.entries());

export const useRouteStateSync = (): void => {
    const params = useParams<RouteParamValues>();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const setRouteParams = useSetRouteParams();
    const setRoutePath = useSetRoutePath();
    const setRouteQueryParams = useSetRouteQueryParams();

    useEffect(() => {
        const queryRecord = toQueryParamsRecord(searchParams);
        console.debug("[routing] useRouteStateSync", {
            pathname: location.pathname,
            params,
            query: queryRecord,
        });
        setRouteParams(params);
        setRoutePath(location.pathname);
        setRouteQueryParams(queryRecord);
    }, [
        location.pathname,
        params,
        searchParams,
        setRouteParams,
        setRoutePath,
        setRouteQueryParams,
    ]);
};

export default useRouteStateSync;
