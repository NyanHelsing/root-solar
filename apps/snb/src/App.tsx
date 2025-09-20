import type { ComponentType } from "react";
import { Route } from "react-router";

import SearchAndBrowseRoute from "./SearchAndBrowseRoute.tsx";

export type ShellRouteComponent = ComponentType;

export const shellRouteConfig = {
  path: "/axioms",
  Component: SearchAndBrowseRoute as ShellRouteComponent,
} as const;

export const SearchAndBrowseApp = () => <SearchAndBrowseRoute />;

export const ShellRoutes = () => (
  <Route path={shellRouteConfig.path} element={<SearchAndBrowseRoute />} />
);

export { default as ComponentHarness } from "./component-tests/ComponentHarness.tsx";
export { default as Header } from "./Header.tsx";
export { default as Hero } from "./Hero.tsx";
export { default as Main } from "./Main.tsx";
export { default as Footer } from "./Footer.tsx";

export default SearchAndBrowseApp;
