import { Suspense, type ReactElement } from "react";

import { FlareLoader, FlareStack } from "@root-solar/flare";
import { ShellHero, ShellLayout } from "@root-solar/layout";
import { useBeing } from "@root-solar/declarations";

import Main from "./Main.tsx";
import NetworkStatusIndicator from "./features/network/NetworkStatusIndicator.tsx";

const SearchAndBrowseContent = (): ReactElement => {
  const being = useBeing();

  return (
    <ShellLayout
      activePath="/axioms"
      hero={<ShellHero />}
      headerActions={<NetworkStatusIndicator />}
      session={{ name: being.name, profileHref: "/auth" }}
      loginHref="/auth"
    >
      <Main />
    </ShellLayout>
  );
};

const SearchAndBrowseFallback = (): ReactElement => (
  <ShellLayout
    activePath="/axioms"
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

const SearchAndBrowseRoute = (): ReactElement => (
  <Suspense fallback={<SearchAndBrowseFallback />}>
    <SearchAndBrowseContent />
  </Suspense>
);

export default SearchAndBrowseRoute;
