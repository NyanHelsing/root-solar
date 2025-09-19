import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route } from "wouter";

import {
  LogLevel,
  createAppLogger,
  initializeObservability,
  parseLogLevel,
} from "@root-solar/observability";

import Header from "./Header.tsx";
import Hero from "./Hero.tsx";
import Main from "./Main.tsx";
import Footer from "./Footer.tsx";
import ComponentHarness from "./component-tests/ComponentHarness.tsx";

import "./index.css";

const environment = process.env.NODE_ENV ?? "development";
const desiredLevel =
  parseLogLevel(process.env.PUBLIC_LOG_LEVEL)
  ?? (environment === "development" ? LogLevel.DEBUG : LogLevel.INFO);

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

clientBootstrapLogger.info("Rendering React application", {
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
  <StrictMode>
    <Header />
    <Route path="/">
      <Hero />
    </Route>
    <Route path="/__component__/:componentName">
      {(params) => (
        <ComponentHarness componentName={params?.componentName} />
      )}
    </Route>
    <Main />
    <Footer />
  </StrictMode>,
);

clientBootstrapLogger.info("React application rendered", {
  tags: ["client", "bootstrap"],
});
