export const isBrowserEnvironment = (): boolean =>
    typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export default isBrowserEnvironment;
