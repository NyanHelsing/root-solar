import { Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import {
    LogLevel,
    createAppLogger,
    initializeObservability,
    parseLogLevel
} from "@root-solar/observability";

import type { RouteErrorBoundaryProps } from "./RouteErrorBoundary.ts";
import { ShellRouter, type RouterProvider } from "./router.ts";
import { shellDefaultFallback } from "./fallbacks.tsx";

import "@root-solar/flare/styles/base";
import "@root-solar/flare/styles/utilities";

export interface BootstrapShellAppOptions {
    routes: ReactNode;
    fallback?: ReactNode;
    rootElementId?: string;
    loggerTags?: string[];
    routeFallback?: RouteErrorBoundaryProps["fallback"];
    routerProvider?: RouterProvider;
}

export const bootstrapShellApp = ({
    routes,
    fallback = shellDefaultFallback,
    rootElementId = "root",
    loggerTags = ["client", "bootstrap"],
    routeFallback,
    routerProvider
}: BootstrapShellAppOptions) => {
    const environment = process.env.NODE_ENV ?? "development";
    const desiredLevel =
        parseLogLevel(process.env.PUBLIC_LOG_LEVEL) ??
        (environment === "development" ? LogLevel.DEBUG : LogLevel.INFO);

    const resolvedLevel = initializeObservability({
        level: desiredLevel,
        metadata: {
            environment,
            platform: typeof window === "undefined" ? "unknown" : "browser"
        }
    });

    const clientBootstrapLogger = createAppLogger("client:bootstrap", {
        tags: loggerTags
    });

    clientBootstrapLogger.info("Rendering shell host", {
        logLevel: LogLevel.getName(resolvedLevel)
    });

    const rootElement = document.getElementById(rootElementId);
    if (!rootElement) {
        clientBootstrapLogger.error("Root element not found", {
            tags: loggerTags
        });
        throw new Error(`Unable to locate #${rootElementId} element for rendering`);
    }

    createRoot(rootElement).render(
        <Suspense fallback={fallback}>
            <ShellRouter routeFallback={routeFallback} routerProvider={routerProvider}>
                {routes}
            </ShellRouter>
        </Suspense>
    );

    clientBootstrapLogger.info("Shell host rendered", {
        tags: loggerTags
    });

    return {
        logger: clientBootstrapLogger,
        logLevel: resolvedLevel
    };
};

export default bootstrapShellApp;
