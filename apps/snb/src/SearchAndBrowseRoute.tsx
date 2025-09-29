import { Suspense, type ReactElement } from "react";
import { useLocation } from "react-router";

import { FlareLoader, FlareStack } from "@root-solar/flare";
import { ShellHero, ShellLayout } from "@root-solar/layout";
import { useBeing } from "@root-solar/auth";

import NetworkStatusIndicator from "./features/network/NetworkStatusIndicator.tsx";
import { Outlet } from "react-router";

const resolveActivePath = (pathname: string): string => {
  if (pathname.startsWith("/missives")) {
    return "/missives";
  }
  if (pathname.startsWith("/axioms")) {
    return "/axioms";
  }
  if (pathname.startsWith("/tags")) {
    return "/tags";
  }
  return "/missives";
};

const SearchAndBrowseContent = (): ReactElement => {
  const being = useBeing();
  const location = useLocation();
  const activePath = resolveActivePath(location.pathname);

  return (
    <ShellLayout
      activePath={activePath}
      hero={<ShellHero />}
      headerActions={<NetworkStatusIndicator />}
      session={{ name: being.name, profileHref: "/auth" }}
      loginHref="/auth"
    >
      <Outlet />
    </ShellLayout>
  );
};

const SearchAndBrowseFallback = (): ReactElement => {
  const location = useLocation();
  const activePath = resolveActivePath(location.pathname);

  return (
    <ShellLayout
      activePath={activePath}
      hero={<ShellHero />}
      headerActions={<NetworkStatusIndicator />}
      session={null}
      loginHref="/auth"
    >
      <FlareStack
        align="center"
        justify="center"
        style={{ minHeight: "12rem" }}
        gap="md"
      >
        <FlareLoader label="Restoring session…" size="lg" />
      </FlareStack>
    </ShellLayout>
  );
};

const SearchAndBrowseRoute = (): ReactElement => (
  <Suspense fallback={<SearchAndBrowseFallback />}>
    <SearchAndBrowseContent />
  </Suspense>
);

export default SearchAndBrowseRoute;
