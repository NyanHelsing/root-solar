import {
  createElement,
  useMemo,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
} from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";

import { useConfig, useInitializeConfig, type AppConfig } from "@root-solar/config";
import { useRouteStateSync } from "@root-solar/routing";

import { RouteErrorBoundary } from "./RouteErrorBoundary.ts";
import type { RouteErrorBoundaryProps } from "./RouteErrorBoundary.ts";
import { defaultRouteFallback } from "./fallbacks.tsx";

const RouteStateSyncBoundary = () => {
    useRouteStateSync();
    return createElement(Outlet);
};

export type RouterProvider = ComponentType<PropsWithChildren>;

export type ShellRuntimeConfig = {
    routeFallback: RouteErrorBoundaryProps["fallback"];
    routerProvider: RouterProvider;
};

type ShellConfigSlice = AppConfig & {
    shell?: ShellRuntimeConfig;
};

const defaultRouterProvider: RouterProvider = ({ children }) =>
    createElement(BrowserRouter, null, children);

const getResolvedShellConfig = (
    config: ShellConfigSlice,
    defaults: ShellRuntimeConfig,
): ShellRuntimeConfig => {
    if (!config.shell) {
        return defaults;
    }

    return {
        routeFallback: config.shell.routeFallback ?? defaults.routeFallback,
        routerProvider: config.shell.routerProvider ?? defaults.routerProvider,
    };
};

export type ShellRouterProps = PropsWithChildren<{
    fallback?: RouteErrorBoundaryProps["fallback"];
    routeFallback?: RouteErrorBoundaryProps["fallback"];
    routerProvider?: RouterProvider;
}>;

export const ShellRouter = ({
    fallback,
    children,
    routeFallback,
    routerProvider,
}: ShellRouterProps): ReactElement => {
    const resolvedRouteFallback = routeFallback ?? defaultRouteFallback;
    const resolvedRouterProvider = routerProvider ?? defaultRouterProvider;

    const initializationConfig = useMemo(
        () => ({
            shell: {
                routeFallback: resolvedRouteFallback,
                routerProvider: resolvedRouterProvider,
            },
        }),
        [resolvedRouteFallback, resolvedRouterProvider],
    );

    useInitializeConfig<ShellConfigSlice>(initializationConfig, [initializationConfig]);

    const config = useConfig<ShellConfigSlice>();
    const shellConfig = getResolvedShellConfig(config, {
        routeFallback: resolvedRouteFallback,
        routerProvider: resolvedRouterProvider,
    });

    const Router = shellConfig.routerProvider;
    const boundaryFallback = fallback ?? shellConfig.routeFallback;

    return createElement(
        Router,
        null,
        createElement(
            RouteErrorBoundary,
            { fallback: boundaryFallback },
            createElement(
                Routes,
                null,
                createElement(Route, { element: createElement(RouteStateSyncBoundary) }, children),
            ),
        ),
    );
};

export default ShellRouter;
