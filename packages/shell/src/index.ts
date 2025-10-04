// TODO: remove this index file - just export the bootstrapShellApp and RouteErrorBoundary separately via package.json
export { bootstrapShellApp } from "./bootstrap.tsx";
export type { BootstrapShellAppOptions } from "./bootstrap.tsx";
export { ShellRouter } from "./router.ts";
export type {
    ShellRouterProps,
    RouterProvider,
    ShellRuntimeConfig,
} from "./router.ts";
export { RouteErrorBoundary } from "./RouteErrorBoundary.ts";
export type { RouteErrorBoundaryProps } from "./RouteErrorBoundary.ts";
export {
    shellDefaultFallback,
    defaultShellErrorFallback,
    defaultRouteFallback,
} from "./fallbacks.tsx";
