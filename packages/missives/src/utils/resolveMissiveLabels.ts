import { capitalize, pluralize } from "@root-solar/globalization";

import { SENTIMENT_TAG_SLUG } from "../constants.ts";

export type MissiveLabels = {
    singular: string;
    plural: string;
    capitalized: string;
};

export const resolveMissiveLabels = (tagSlug?: string): MissiveLabels => {
    if (tagSlug === SENTIMENT_TAG_SLUG) {
        return {
            singular: "axiom",
            plural: "axioms",
            capitalized: "Axiom",
        } satisfies MissiveLabels;
    }
    const singular = tagSlug ?? "missive";
    return {
        singular,
        plural: pluralize(singular),
        capitalized: capitalize(singular),
    } satisfies MissiveLabels;
};

export default resolveMissiveLabels;
