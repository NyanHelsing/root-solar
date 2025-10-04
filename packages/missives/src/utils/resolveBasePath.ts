import { pluralize } from "@root-solar/globalization";

import { SENTIMENT_TAG_SLUG } from "../constants.ts";

export const resolveBasePath = (
    basePath: string | undefined,
    tagSlug: string | undefined,
): string => {
    if (basePath) {
        const normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
        const segments = normalized.split("/").filter(Boolean);
        if (segments.length === 0) {
            return "/";
        }
        return `/${segments[0]}`;
    }
    if (!tagSlug) {
        return "/missives";
    }
    if (tagSlug === SENTIMENT_TAG_SLUG) {
        return "/axioms";
    }
    return `/${pluralize(tagSlug)}`;
};

export default resolveBasePath;
