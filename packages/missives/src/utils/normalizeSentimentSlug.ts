import { normalizeFilterValue } from "./listUtils.ts";

export const normalizeSentimentSlug = (value?: string | null): string | null =>
  normalizeFilterValue(value);

export default normalizeSentimentSlug;
