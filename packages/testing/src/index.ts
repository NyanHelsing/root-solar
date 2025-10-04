import "./components/index.ts";

export { registerComponent, resolveComponent, listRegisteredComponents } from "./registry.ts";
export {
    buildComponentUrl,
    COMPONENT_ROUTE_PATTERN,
    COMPONENT_ROUTE_PREFIX,
    type BuildComponentUrlOptions
} from "./routes.ts";
export { default as ComponentHarnessApp } from "./harness/App.tsx";
export { toComponentSlug } from "./utils/slug.ts";
