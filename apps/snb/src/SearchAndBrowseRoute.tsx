import type { ReactElement } from "react";

import Footer from "./Footer.tsx";
import Header from "./Header.tsx";
import Hero from "./Hero.tsx";
import Main from "./Main.tsx";

const SearchAndBrowseRoute = (): ReactElement => (
  <>
    <Header />
    <Hero />
    <Main />
    <Footer />
  </>
);

export default SearchAndBrowseRoute;
