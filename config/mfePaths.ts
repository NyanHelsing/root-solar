const PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;

export const DEFAULT_SHELL_MOUNT = "/static/modules/shell";
export const DEFAULT_SNB_MOUNT = "/static/modules/snb";
export const DEFAULT_SHELL_DIST_SUBDIR = "shell";
export const DEFAULT_SNB_DIST_SUBDIR = "snb";

const ensureLeadingSlash = (value: string) =>
  value.startsWith("/") ? value : `/${value}`;
const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

const hasProtocol = (value: string) => PROTOCOL_REGEX.test(value);

export const resolveMountPath = (
  value: string | undefined,
  fallback: string,
) => {
  if (!value) {
    return fallback;
  }

  if (hasProtocol(value)) {
    return fallback;
  }

  const normalized = ensureLeadingSlash(stripTrailingSlash(value));
  return normalized || fallback;
};

export const resolveBaseUrl = (
  value: string | undefined,
  fallback: string,
) => {
  if (!value) {
    return fallback;
  }

  if (hasProtocol(value)) {
    return stripTrailingSlash(value);
  }

  const normalized = ensureLeadingSlash(stripTrailingSlash(value));
  return normalized || fallback;
};

export const resolveAssetPrefix = (
  value: string | undefined,
  fallback: string,
) => {
  const source = value ?? fallback;

  if (hasProtocol(source)) {
    return ensureTrailingSlash(stripTrailingSlash(source));
  }

  return ensureTrailingSlash(ensureLeadingSlash(stripTrailingSlash(source)));
};

export const resolveDistSubdir = (
  value: string | undefined,
  fallback: string,
) => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed || fallback;
};
