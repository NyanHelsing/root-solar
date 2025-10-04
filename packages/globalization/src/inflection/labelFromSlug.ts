import { capitalize } from "./capitalize.ts";

export const labelFromSlug = (value: string): string =>
    value.split(/[-_]/).filter(Boolean).map(capitalize).join(" ");

export default labelFromSlug;
