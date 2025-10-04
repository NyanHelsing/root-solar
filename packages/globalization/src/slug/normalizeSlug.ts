const SLUG_SEPARATOR_PATTERN = /[\s_]+/g;
const NON_SLUG_CHARS = /[^a-z0-9-]/gi;
const DASH_COLLAPSE = /-+/g;
const DASH_TRIM = /^-|-$/g;

export const normalizeSlug = (value: string): string => {
    const ascii = value.normalize("NFKD");
    const dashed = ascii.replace(SLUG_SEPARATOR_PATTERN, "-");
    const cleaned = dashed.replace(NON_SLUG_CHARS, "");
    const collapsed = cleaned.replace(DASH_COLLAPSE, "-");
    const trimmed = collapsed.replace(DASH_TRIM, "");
    return trimmed.toLowerCase();
};

export const normalizeOptionalSlug = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = normalizeSlug(trimmed);
    return normalized.length > 0 ? normalized : null;
};

export default normalizeSlug;
