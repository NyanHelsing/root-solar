import { normalizeOptionalSlug } from "@root-solar/globalization";

const stripTagPrefix = (value: string) => (value.slice(0, 4).toLowerCase() === "tag:" ? value.slice(4) : value);

export const toTagId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  const normalizedSlug = normalizeOptionalSlug(stripTagPrefix(trimmed));
  if (!normalizedSlug) {
    return null;
  }
  return `tag:${normalizedSlug}`;
};

export default toTagId;
