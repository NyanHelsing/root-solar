import { lazy } from "react";
import { Route } from "react-router";

import { RootSolarHomepage } from "@root-solar/homepage";
import { MissiveDetail, MissiveListRoute, AxiomaticMissiveListRoute } from "@root-solar/missives";
import { TagList } from "@root-solar/tagging";
import { bootstrapShellApp } from "@root-solar/shell";

const loadingFallback = <output aria-live="polite">Loading experience…</output>;

const AuthApp = lazy(() => import("auth/App"));
const SearchAndBrowseApp = lazy(() => import("snb/App"));

const HomeRoute = () => <RootSolarHomepage />;

bootstrapShellApp({
    routes: (
        <>
            <Route index element={<HomeRoute />} />
            <Route path="/auth" element={<AuthApp />} hydrateFallbackElement={loadingFallback} />
            <Route
                path="/missives"
                element={<SearchAndBrowseApp />}
                hydrateFallbackElement={loadingFallback}
            >
                <Route index element={<MissiveListRoute />} />
                <Route path=":missiveId" element={<MissiveDetail basePath="/missives" />} />
            </Route>
            <Route
                path="/axioms"
                element={<SearchAndBrowseApp />}
                hydrateFallbackElement={loadingFallback}
            >
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
            <Route
                path="/tags"
                element={<SearchAndBrowseApp />}
                hydrateFallbackElement={loadingFallback}
            >
                <Route index element={<TagList />} />
            </Route>
        </>
    ),
});
