import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route } from "wouter";

import Header from "./Header.tsx";
import Hero from "./Hero.tsx";
import Main from "./Main.tsx";
import Footer from "./Footer.tsx";
import ComponentHarness from "./component-tests/ComponentHarness.tsx";

import "./index.css";

createRoot(document.getElementById("root")).render(
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
