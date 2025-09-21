import type { ReactElement } from "react";
import {
  lazy,
  Suspense,
  Component,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import { ShellLayout } from "@root-solar/layout";
import { RootSolarHomepage } from "@root-solar/homepage";

const loadingFallback = (
  <div role="status" aria-live="polite">
    Loading experience…
  </div>
);

const AuthApp = lazy(() => import("auth/App"));
const SearchAndBrowseApp = lazy(() => import("snb/App"));

const HomeRoute = () => <RootSolarHomepage />;

class RouteErrorBoundary extends Component<
  PropsWithChildren<{ fallback?: ReactNode }>,
  { error: Error | null }
> {
  constructor(props: PropsWithChildren<{ fallback?: ReactNode }>) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Route rendering failed", error);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return (
        this.props.fallback ?? (
          <ShellLayout>
            <section>
              <h1>Something went wrong</h1>
              <p>{error.message}</p>
            </section>
          </ShellLayout>
        )
      );
    }
    return this.props.children;
  }
}

export default function AppShell(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<HomeRoute />} />
        <Route
          path="/auth"
          element={
            <RouteErrorBoundary>
              <AuthApp />
            </RouteErrorBoundary>
          }
          hydrateFallbackElement={loadingFallback}
        />
        <Route
          path="/axioms/*"
          element={
            <RouteErrorBoundary>
              <SearchAndBrowseApp />
            </RouteErrorBoundary>
          }
          hydrateFallbackElement={loadingFallback}
        />
      </Routes>
    </BrowserRouter>
  );
}
