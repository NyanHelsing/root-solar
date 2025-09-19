import type { ReactElement } from "react";

import Header from "./Header.tsx";
import Hero from "./Hero.tsx";
import Main from "./Main.tsx";
import Footer from "./Footer.tsx";
import ComponentHarness from "./component-tests/ComponentHarness.tsx";

export function SearchAndBrowseApp(): ReactElement {
  return (
    <>
      <Header />
      <Hero />
      <Main />
      <Footer />
    </>
  );
}

export { ComponentHarness };
export { Header, Hero, Main, Footer };
