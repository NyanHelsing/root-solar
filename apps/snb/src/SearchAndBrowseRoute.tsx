import type { ReactElement } from "react";
import { useAtomValue } from "jotai";

import { ShellHero, ShellLayout } from "@root-solar/layout";

import Main from "./Main.tsx";
import NetworkStatusIndicator from "./features/network/NetworkStatusIndicator.tsx";
import { beingAtom } from "./features/beings/store.ts";

const SearchAndBrowseRoute = (): ReactElement => {
  const being = useAtomValue(beingAtom);

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

export default SearchAndBrowseRoute;
