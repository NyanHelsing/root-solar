import "global-jsdom/register";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { render } from "@testing-library/react";
import { createElement, Fragment, type ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { createStore, Provider } from "jotai";

import { useRouteStateSync } from "../useRouteStateSync.ts";
import { routeParamsAtom } from "../routeParamsAtom.ts";
import { routePathAtom } from "../routePathAtom.ts";
import { routeQueryParamsAtom } from "../routeQueryParamsAtom.ts";

const SyncBoundary = ({ children }: { children: ReactNode }) => {
    useRouteStateSync();
    return createElement(Fragment, null, children);
};

describe("useRouteStateSync", () => {
    it("synchronizes params, path, and query state during its lifecycle", async () => {
        const store = createStore();
        const Wrapper = ({ children }: { children: ReactNode }) =>
            createElement(
                Provider,
                { store },
                createElement(
                    MemoryRouter,
                    { initialEntries: ["/missives/42?tag=solar&view=grid"] },
                    createElement(
                        Routes,
                        null,
                        createElement(Route, {
                            path: "/missives/:id",
                            element: createElement(SyncBoundary, null, children),
                        }),
                    ),
                ),
            );

        const { unmount } = render(createElement("span", null, "child"), {
            wrapper: Wrapper,
        });

        assert.deepEqual(store.get(routeParamsAtom), { id: "42" });
        assert.equal(store.get(routePathAtom), "/missives/42");
        assert.deepEqual(store.get(routeQueryParamsAtom), {
            tag: "solar",
            view: "grid",
        });

        unmount();
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
});
