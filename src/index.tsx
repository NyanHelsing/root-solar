import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route } from "wouter";

import { LogLevel } from "@catsle/caretta";

import Header from "./Header.tsx";
import Hero from "./Hero.tsx";
import Main from "./Main.tsx";
import Footer from "./Footer.tsx";
import ComponentHarness from "./component-tests/ComponentHarness.tsx";
import { createAppLogger, initializeLogging } from "./logging/index.ts";

import "./index.css";

const resolvedLevel = initializeLogging();
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
