import type { ReactElement } from "react";
import { Suspense, lazy } from "react";
import { Route } from "wouter";

const Header = lazy(() => import("snb/App").then((module) => ({ default: module.Header })));
const Hero = lazy(() => import("snb/App").then((module) => ({ default: module.Hero })));
const Main = lazy(() => import("snb/App").then((module) => ({ default: module.Main })));
const Footer = lazy(() => import("snb/App").then((module) => ({ default: module.Footer })));
const ComponentHarness = lazy(() =>
  import("snb/App").then((module) => ({ default: module.ComponentHarness })),
);

const loadingFallback = (
  <div role="status" aria-live="polite">
    Loading search and browse experience…
  </div>
);

export default function AppShell(): ReactElement {
  return (
    <Suspense fallback={loadingFallback}>
      <Header />
      <Route path="/">
        <Hero />
      </Route>
      <Route path="/__component__/:componentName">
        {(params) => <ComponentHarness componentName={params?.componentName} />}
      </Route>
      <Main />
      <Footer />
    </Suspense>
  );
}
