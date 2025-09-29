import { isBrowserEnvironment } from "./is-browser-environment.ts";

export const getLocalStorage = (): Storage => {
  if (!isBrowserEnvironment()) {
    throw new Error("Session storage requires a browser environment");
  }
  return window.localStorage;
};

export default getLocalStorage;
