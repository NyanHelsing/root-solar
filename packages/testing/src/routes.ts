import { toComponentSlug } from "./utils/slug.ts";

export const COMPONENT_ROUTE_PREFIX = "/__component__";
export const COMPONENT_ROUTE_PATTERN = `${COMPONENT_ROUTE_PREFIX}/:componentSlug`;

export interface BuildComponentUrlOptions {
    props?: Record<string, unknown>;
    searchParams?: Record<string, string>;
}

export const buildComponentUrl = (
    componentName: string,
    options: BuildComponentUrlOptions = {}
): string => {
    const slug = toComponentSlug(componentName);
    const params = new URLSearchParams(options.searchParams);

    if (options.props) {
        params.set("props", JSON.stringify(options.props));
    }

    const query = params.toString();
    return `${COMPONENT_ROUTE_PREFIX}/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`;
};
