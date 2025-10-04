import type { ComponentType } from "react";
import { Outlet, Route } from "react-router";

import SearchAndBrowseRoute from "./SearchAndBrowseRoute.tsx";
import { MissiveDetail, MissiveListRoute, AxiomaticMissiveListRoute } from "@root-solar/missives";
import { TagList } from "@root-solar/tagging";
import { useRouteStateSync } from "@root-solar/routing";

export type ShellRouteComponent = ComponentType;

export const shellRouteConfig = {
    path: "/missives/*",
    Component: SearchAndBrowseRoute as ShellRouteComponent
} as const;

export const SearchAndBrowseApp = () => <SearchAndBrowseRoute />;

const RouteStateSync = () => {
    useRouteStateSync();
    return <Outlet />;
};

export const ShellRoutes = () => (
    <>
        <Route path="/missives" element={<SearchAndBrowseRoute />}>
            <Route element={<RouteStateSync />}>
                <Route index element={<MissiveListRoute />} />
                <Route path=":missiveId" element={<MissiveDetail basePath="/missives" />} />
            </Route>
        </Route>
        <Route path="/axioms" element={<SearchAndBrowseRoute />}>
            <Route element={<RouteStateSync />}>
                <Route index element={<AxiomaticMissiveListRoute />} />
                <Route
                    path=":missiveId"
                    element={
                        <MissiveDetail
                            tagSlug="axiomatic"
                            sentiment="axiomatic"
                            basePath="/axioms"
                        />
                    }
                />
            </Route>
        </Route>
        <Route path="/tags" element={<SearchAndBrowseRoute />}>
            <Route element={<RouteStateSync />}>
                <Route index element={<TagList />} />
            </Route>
        </Route>
    </>
);

export { default as ComponentHarness } from "./component-tests/ComponentHarness.tsx";
export {
    RootSolarHeader as Header,
    ShellHero as Hero,
    RootSolarFooter as Footer,
    ShellLayout
} from "@root-solar/layout";

export default SearchAndBrowseApp;
