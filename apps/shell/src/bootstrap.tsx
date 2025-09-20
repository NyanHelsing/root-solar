import { Suspense } from "react";
import { createRoot } from "react-dom/client";

import {
  LogLevel,
  createAppLogger,
  initializeObservability,
  parseLogLevel,
} from "@root-solar/observability";

import AppShell from "./AppShell.tsx";

import "@root-solar/flare/styles/base";
import "@root-solar/flare/styles/utilities";

console.error("RUNNING APPSHELL BOOTSTRAP");

const environment = process.env.NODE_ENV ?? "development";
const desiredLevel =
  parseLogLevel(process.env.PUBLIC_LOG_LEVEL) ??
  (environment === "development" ? LogLevel.DEBUG : LogLevel.INFO);

const resolvedLevel = initializeObservability({
  level: desiredLevel,
  metadata: {
    environment,
    platform: typeof window === "undefined" ? "unknown" : "browser",
  },
});
const clientBootstrapLogger = createAppLogger("client:bootstrap", {
  tags: ["client", "bootstrap"],
});

clientBootstrapLogger.info("Rendering shell micro frontend", {
  logLevel: LogLevel.getName(resolvedLevel),
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  clientBootstrapLogger.error("Root element not found", {
    tags: ["client", "bootstrap"],
  });
  throw new Error("Unable to locate #root element for rendering");
}

createRoot(rootElement).render(
  <Suspense
    fallback={
      <div role="status" aria-live="polite">
        Loading application shell…
      </div>
    }
  >
    <AppShell />
  </Suspense>,
);

clientBootstrapLogger.info("Shell micro frontend rendered", {
  tags: ["client", "bootstrap"],
});
