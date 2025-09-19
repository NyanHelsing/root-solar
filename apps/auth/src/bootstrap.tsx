import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AuthApp } from "./App.tsx";

import "../../shared/styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Unable to find #root container for the auth micro frontend");
}

declare global {
  interface Window {
    __ROOT_SOLAR_AUTH_ROOT__?: ReturnType<typeof createRoot>;
  }
}

const root = window.__ROOT_SOLAR_AUTH_ROOT__ ?? createRoot(rootElement);
window.__ROOT_SOLAR_AUTH_ROOT__ = root;

root.render(
  <StrictMode>
    <AuthApp />
  </StrictMode>,
);
