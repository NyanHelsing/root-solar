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
export {
  RootSolarHeader as Header,
  ShellHero as Hero,
  RootSolarFooter as Footer,
  ShellLayout,
} from "@root-solar/layout";
export { default as Main } from "./Main.tsx";

export default SearchAndBrowseApp;
